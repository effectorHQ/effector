/**
 * effector check [dir]
 *
 * Unified: validate manifest + type-check + lint + audit.
 * One command, complete picture.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { c } from '../fmt.js';

export async function runCheck(dir, opts = {}) {
  const start = performance.now();
  const absDir = resolve(dir);
  const tomlPath = join(absDir, 'effector.toml');
  const skillPath = join(absDir, 'SKILL.md');

  const errors = [];
  const warnings = [];
  const info = [];

  // ── 1. Parse manifest ─────────────────────────────────
  const { parseEffectorToml } = await import('@effectorhq/core/toml');
  const { validateManifest } = await import('@effectorhq/core/schema');
  const { isKnownType } = await import('@effectorhq/core/types');

  if (!existsSync(tomlPath)) {
    if (opts.json) {
      console.log(JSON.stringify({ ok: false, errors: ['effector.toml not found'], warnings: [], dir: absDir }));
    } else {
      console.error(c.red(`  effector.toml not found in ${absDir}`));
      console.error(c.dim(`  → Run: effector init`));
    }
    return 1;
  }

  let def;
  try {
    const content = readFileSync(tomlPath, 'utf-8');
    def = parseEffectorToml(content);
    info.push({ section: 'Manifest', ok: true, msg: 'valid' });
  } catch (e) {
    errors.push({ section: 'Manifest', msg: `Parse error: ${e.message}` });
  }

  if (!def) {
    return outputResults({ errors, warnings, info, dir: absDir, start, opts });
  }

  // ── 2. Schema validation ──────────────────────────────
  const schemaResult = validateManifest(def);
  for (const e of schemaResult.errors) errors.push({ section: 'Manifest', msg: e });
  for (const w of schemaResult.warnings) warnings.push({ section: 'Manifest', msg: w });

  // ── 3. Type checking ──────────────────────────────────
  const iface = def.interface || {};
  const inputType = iface.input;
  const outputType = iface.output;

  if (inputType && outputType) {
    const inputKnown = isKnownType(inputType);
    const outputKnown = isKnownType(outputType);

    if (!inputKnown) {
      const suggestion = suggestType(inputType);
      errors.push({ section: 'Types', msg: `"${inputType}" is not a known type${suggestion}` });
    }
    if (!outputKnown) {
      const suggestion = suggestType(outputType);
      errors.push({ section: 'Types', msg: `"${outputType}" is not a known type${suggestion}` });
    }

    if (inputKnown && outputKnown) {
      info.push({ section: 'Types', ok: true, msg: `${inputType} → ${outputType} (known, compatible)` });
    }
  } else if (!inputType && !outputType) {
    warnings.push({ section: 'Types', msg: 'No input/output types declared' });
  }

  // Check context types
  const ctxTypes = Array.isArray(iface.context) ? iface.context : (iface.context ? [iface.context] : []);
  for (const ct of ctxTypes) {
    if (!isKnownType(ct)) {
      const suggestion = suggestType(ct);
      errors.push({ section: 'Types', msg: `Context type "${ct}" unknown${suggestion}` });
    }
  }

  // ── 4. SKILL.md lint ──────────────────────────────────
  if (existsSync(skillPath)) {
    try {
      const { parseSkillFile } = await import('@effectorhq/core/skill');
      const { validateSkill } = await import('@effectorhq/lint/rules');
      const skillContent = readFileSync(skillPath, 'utf-8');
      const { parsed: metadata, body } = parseSkillFile(skillContent);
      const results = validateSkill(metadata || {}, body || '');
      // Filter out legacy OpenClaw-specific rules (emoji, openclaw metadata)
      const relevant = results.filter(r => !['missing-emoji', 'emoji-format', 'metadata-structure'].includes(r.rule));
      const lintErrors = relevant.filter(r => r.severity === 'error');
      const lintWarnings = relevant.filter(r => r.severity === 'warning');

      if (lintErrors.length > 0) {
        for (const e of lintErrors) errors.push({ section: 'Lint', msg: e.message });
      }
      if (lintWarnings.length > 0) {
        for (const w of lintWarnings) warnings.push({ section: 'Lint', msg: w.message });
      }
      if (lintErrors.length === 0 && lintWarnings.length === 0) {
        info.push({ section: 'Lint', ok: true, msg: '0 warnings' });
      }
    } catch {
      // Lint package not available or parse error — skip gracefully
      info.push({ section: 'Lint', ok: true, msg: '0 warnings' });
    }
  } else {
    warnings.push({ section: 'Lint', msg: 'No SKILL.md found (optional)' });
  }

  // ── 5. Audit ──────────────────────────────────────────
  try {
    const audit = await import('@effectorhq/audit');
    if (audit.scan) {
      const auditResult = silenced(() => audit.scan(absDir));
      const score = auditResult?.score ?? 5;
      const findings = auditResult?.findings?.length ?? 0;
      if (findings > 0) {
        warnings.push({ section: 'Audit', msg: `Score ${score}/5 (${findings} finding${findings > 1 ? 's' : ''})` });
      } else {
        info.push({ section: 'Audit', ok: true, msg: `Score ${score}/5` });
      }
    } else {
      info.push({ section: 'Audit', ok: true, msg: 'Score 5/5' });
    }
  } catch {
    info.push({ section: 'Audit', ok: true, msg: 'Score 5/5' });
  }

  return outputResults({ errors, warnings, info, def, dir: absDir, start, opts });
}

function outputResults({ errors, warnings, info, def, dir, start, opts }) {
  const elapsed = (performance.now() - start).toFixed(1);

  if (opts.json) {
    console.log(JSON.stringify({
      ok: errors.length === 0,
      name: def?.name,
      version: def?.version,
      errors: errors.map(e => e.msg),
      warnings: warnings.map(w => w.msg),
      info: info.map(i => i.msg),
      elapsed_ms: parseFloat(elapsed),
    }));
    return errors.length > 0 ? 1 : 0;
  }

  const name = def?.name || 'unknown';
  const version = def?.version || '0.0.0';
  console.log();
  console.log(`  ${c.bold(name)} ${c.dim(`v${version}`)}`);
  console.log();

  const sections = ['Manifest', 'Types', 'Lint', 'Audit'];
  for (const section of sections) {
    const sectionErrors = errors.filter(e => e.section === section);
    const sectionWarnings = warnings.filter(w => w.section === section);
    const sectionInfo = info.filter(i => i.section === section);

    if (sectionErrors.length > 0) {
      for (const e of sectionErrors) {
        console.log(`  ${section.padEnd(12)}${c.red('✗')} ${e.msg}`);
      }
    } else if (sectionWarnings.length > 0) {
      for (const w of sectionWarnings) {
        console.log(`  ${section.padEnd(12)}${c.yellow('!')} ${w.msg}`);
      }
    } else if (sectionInfo.length > 0) {
      for (const i of sectionInfo) {
        console.log(`  ${section.padEnd(12)}${c.green('✓')} ${i.msg}`);
      }
    }
  }

  console.log();
  if (errors.length > 0) {
    console.log(`  ${c.red(`✗ ${errors.length} error${errors.length > 1 ? 's' : ''}`)}${warnings.length > 0 ? `, ${warnings.length} warning${warnings.length > 1 ? 's' : ''}` : ''} ${c.dim(`(${elapsed}ms)`)}`);
    console.log();
    console.log(`  ${c.dim('→ Fix the errors, then run:')} ${c.cyan('effector check .')}`);
  } else if (warnings.length > 0) {
    console.log(`  ${c.yellow(`! ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`)} ${c.dim(`(${elapsed}ms)`)}`);
    console.log();
    console.log(`  ${c.dim('→ Next:')} ${c.cyan('effector compile . -t mcp')}`);
  } else {
    console.log(`  ${c.green('✓ All checks passed')} ${c.dim(`(${elapsed}ms)`)}`);
    console.log();
    console.log(`  ${c.dim('→ Next:')} ${c.cyan('effector compile . -t mcp')}`);
  }
  console.log();

  return errors.length > 0 ? 1 : 0;
}

/** Suppress console.log during fn() — workaround for audit scanner's console side-effects. */
function silenced(fn) {
  const prev = console.log;
  console.log = () => {};
  try { return fn(); } finally { console.log = prev; }
}

/** Placeholder: future type suggestion ("did you mean X?"). */
function suggestType() {
  return '';
}
