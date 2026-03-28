/**
 * Golden path integration tests for the effector CLI.
 *
 * These tests verify the P0 flow: init → check → compile
 * Each test runs the CLI as a subprocess to match real usage.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'effector.js');
const TMP = join(__dirname, '..', '.test-tmp');

function run(...args) {
  return execFileSync('node', [CLI, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1' },
    timeout: 10000,
  });
}

function runWithStatus(...args) {
  try {
    const stdout = run(...args);
    return { stdout, code: 0 };
  } catch (e) {
    return { stdout: e.stdout || '', stderr: e.stderr || '', code: e.status };
  }
}

describe('effector CLI', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(TMP, { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  test('--help shows usage', () => {
    const out = run('--help');
    assert.match(out, /effector.*typed capabilities/);
    assert.match(out, /init/);
    assert.match(out, /check/);
    assert.match(out, /compile/);
  });

  test('--version shows semver', () => {
    const out = run('--version');
    assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
  });

  test('init creates working manifest (default skill template)', () => {
    const dir = join(TMP, 'skill-test');
    run('init', dir);

    assert.ok(existsSync(join(dir, 'effector.toml')));
    assert.ok(existsSync(join(dir, 'SKILL.md')));

    const toml = readFileSync(join(dir, 'effector.toml'), 'utf-8');
    assert.match(toml, /name = "skill-test"/);
    assert.match(toml, /type = "skill"/);
  });

  test('init with --template workflow', () => {
    const dir = join(TMP, 'wf-test');
    run('init', dir, '--template', 'workflow');

    const toml = readFileSync(join(dir, 'effector.toml'), 'utf-8');
    assert.match(toml, /type = "workflow"/);
    assert.match(toml, /RepositoryRef/);
  });

  test('init refuses to overwrite existing manifest', () => {
    const dir = join(TMP, 'overwrite-test');
    run('init', dir);
    const result = runWithStatus('init', dir);
    assert.equal(result.code, 1);
  });

  test('init with unknown template fails', () => {
    const dir = join(TMP, 'bad-template');
    const result = runWithStatus('init', dir, '--template', 'nosuchtemplate');
    assert.equal(result.code, 1);
  });

  test('check passes on init output (all templates)', () => {
    for (const template of ['skill', 'workflow', 'extension', 'minimal']) {
      const dir = join(TMP, `check-${template}`);
      run('init', dir, '--template', template);

      const result = runWithStatus('check', dir, '--json');
      assert.equal(result.code, 0, `check failed for template: ${template}`);

      const json = JSON.parse(result.stdout);
      assert.equal(json.ok, true, `check not ok for template: ${template}`);
      assert.equal(json.errors.length, 0, `errors for template: ${template}`);
    }
  });

  test('check fails on missing toml', () => {
    const dir = join(TMP, 'no-toml');
    mkdirSync(dir, { recursive: true });
    const result = runWithStatus('check', dir, '--json');
    assert.equal(result.code, 1);
  });

  test('compile produces valid MCP JSON', () => {
    const dir = join(TMP, 'compile-mcp');
    run('init', dir);
    const out = run('compile', dir, '-t', 'mcp');
    const json = JSON.parse(out);
    assert.ok(json.name);
    assert.ok(json.inputSchema);
  });

  test('compile produces valid OpenAI Agents format', () => {
    const dir = join(TMP, 'compile-oai');
    run('init', dir);
    const out = run('compile', dir, '-t', 'openai-agents');
    const json = JSON.parse(out);
    assert.equal(json.type, 'function');
    assert.ok(json.function.name);
  });

  test('compile to JSON IR preserves interface', () => {
    const dir = join(TMP, 'compile-json');
    run('init', dir);
    const out = run('compile', dir, '-t', 'json');
    const json = JSON.parse(out);
    assert.equal(json.interface.input, 'CodeDiff');
    assert.equal(json.interface.output, 'ReviewReport');
  });

  test('compile fails without --target', () => {
    const dir = join(TMP, 'compile-no-target');
    run('init', dir);
    const result = runWithStatus('compile', dir);
    assert.equal(result.code, 1);
  });

  test('compile fails with unknown target', () => {
    const dir = join(TMP, 'compile-bad-target');
    run('init', dir);
    const result = runWithStatus('compile', dir, '-t', 'doesnotexist');
    assert.equal(result.code, 1);
  });

  test('inspect shows parsed interface', () => {
    const dir = join(TMP, 'inspect-test');
    run('init', dir);
    const out = run('inspect', dir, '--json');
    const json = JSON.parse(out);
    assert.ok(json.name);
    assert.ok(json.interface);
  });

  test('unknown command fails gracefully', () => {
    const result = runWithStatus('nosuchcommand');
    assert.equal(result.code, 1);
  });
});
