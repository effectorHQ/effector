import test from 'node:test';
import assert from 'node:assert';
import { parseSkillFile, extractMetadata } from '../src/parser.js';

test('Parser: parseSkillFile basic valid file', () => {
  const content = `---
name: test-skill
description: A test skill
---

## Purpose

This is a test skill.
`;

  const result = parseSkillFile(content);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.error, null);
  assert.strictEqual(result.parsed.name, 'test-skill');
  assert.strictEqual(result.parsed.description, 'A test skill');
});

test('Parser: parseSkillFile missing opening delimiter', () => {
  const content = `name: test-skill
description: A test skill
---

## Purpose

This is a test skill.
`;

  const result = parseSkillFile(content);
  assert.strictEqual(result.valid, false);
  assert.match(result.error, /must start with ---/);
});

test('Parser: parseSkillFile missing closing delimiter', () => {
  const content = `---
name: test-skill
description: A test skill

## Purpose

This is a test skill.
`;

  const result = parseSkillFile(content);
  assert.strictEqual(result.valid, false);
  assert.match(result.error, /must close frontmatter/);
});

test('Parser: extractMetadata with full structure', () => {
  const parsed = {
    name: 'docker-cli',
    description: 'Manage Docker containers',
    metadata: {
      openclaw: {
        emoji: '🐳'
      }
    }
  };

  const metadata = extractMetadata(parsed);
  assert.strictEqual(metadata.name, 'docker-cli');
  assert.strictEqual(metadata.emoji, '🐳');
});

test('Parser: extractMetadata with missing optional fields', () => {
  const parsed = {
    name: 'simple-skill',
    description: 'A simple skill'
  };

  const metadata = extractMetadata(parsed);
  assert.strictEqual(metadata.name, 'simple-skill');
  assert.strictEqual(metadata.emoji, '');
  assert.deepStrictEqual(metadata.install, []);
});
