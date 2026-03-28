import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { parseSkillFile, extractMetadata } from '../src/parser.js';
import { validateSkill } from '../src/rules.js';

test('Integration: validate simple skill', () => {
  const content = `---
name: test-skill
description: A test skill that does testing
---

## Purpose

This skill tests things.

## When to Use

When you need to test.

## Setup

Simple setup here.
`;

  const parsed = parseSkillFile(content);
  assert.strictEqual(parsed.valid, true);

  const metadata = extractMetadata(parsed.parsed);
  assert.strictEqual(metadata.name, 'test-skill');
  assert.match(metadata.description, /test skill/);

  const results = validateSkill(metadata, parsed.body);
  const errors = results.filter(r => r.severity === 'error');
  assert.strictEqual(errors.length, 0);
});

test('Integration: validate skill with emoji', () => {
  const skillMarkdown = `---
name: github-actions
description: Manage GitHub Actions workflows and runs
---

## Purpose

Manage GitHub Actions workflows, view runs, and trigger actions.

## When to Use

- Monitor workflow executions
- Trigger workflows manually

## Setup

Install GitHub CLI first.
`;

  const parsed = parseSkillFile(skillMarkdown);
  assert.strictEqual(parsed.valid, true);

  const metadata = extractMetadata(parsed.parsed);
  assert.strictEqual(metadata.name, 'github-actions');
  assert.match(metadata.description, /GitHub Actions/);

  const results = validateSkill(metadata, parsed.body);
  const errors = results.filter(r => r.severity === 'error');
  assert.strictEqual(errors.length, 0);
});
