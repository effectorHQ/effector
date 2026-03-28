import test from 'node:test';
import assert from 'node:assert';
import { validateSkill, SEVERITY } from '../src/rules.js';

test('Rules: validateSkill detects missing name', () => {
  const metadata = {
    name: '',
    description: 'A valid description',
    metadata: {},
    emoji: '🔧',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nTest');
  const errors = results.filter(r => r.severity === SEVERITY.ERROR);
  assert.strictEqual(errors.some(e => e.rule === 'required-fields'), true);
});

test('Rules: validateSkill detects missing description', () => {
  const metadata = {
    name: 'test-skill',
    description: '',
    metadata: {},
    emoji: '🔧',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nTest');
  const errors = results.filter(r => r.severity === SEVERITY.ERROR);
  assert.strictEqual(errors.some(e => e.rule === 'required-fields'), true);
});

test('Rules: validateSkill passes with valid minimal skill', () => {
  const metadata = {
    name: 'valid-skill',
    description: 'A valid description for testing',
    metadata: { openclaw: { emoji: '✅' } },
    emoji: '✅',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nValid skill description.');
  const errors = results.filter(r => r.severity === SEVERITY.ERROR);
  assert.strictEqual(errors.length, 0);
});

test('Rules: validateSkill warns on bad name format', () => {
  const metadata = {
    name: 'BadName',
    description: 'A valid description for testing',
    metadata: {},
    emoji: '🔧',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nTest');
  const warnings = results.filter(r => r.rule === 'name-format');
  assert.strictEqual(warnings.length > 0, true);
});

test('Rules: validateSkill warns on short description', () => {
  const metadata = {
    name: 'valid-skill',
    description: 'Short',
    metadata: {},
    emoji: '🔧',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nTest');
  const warnings = results.filter(r => r.rule === 'description-length');
  assert.strictEqual(warnings.length > 0, true);
});

test('Rules: validateSkill warns on long description', () => {
  const metadata = {
    name: 'valid-skill',
    description: 'A'.repeat(250),
    metadata: {},
    emoji: '🔧',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nTest');
  const warnings = results.filter(r => r.rule === 'description-length');
  assert.strictEqual(warnings.length > 0, true);
});

test('Rules: validateSkill warns on missing emoji', () => {
  const metadata = {
    name: 'valid-skill',
    description: 'A valid description for testing',
    metadata: {},
    emoji: '',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, '## Purpose\n\nTest');
  const warnings = results.filter(r => r.rule === 'missing-emoji');
  assert.strictEqual(warnings.length > 0, true);
});

test('Rules: validateSkill warnings on missing sections in body', () => {
  const metadata = {
    name: 'valid-skill',
    description: 'A valid description for testing',
    metadata: {},
    emoji: '🔧',
    requires: {},
    install: []
  };

  const results = validateSkill(metadata, 'Just some text without proper structure.');
  const warnings = results.filter(r => r.rule === 'missing-sections');
  assert.strictEqual(warnings.length > 0, true);
});

test('Rules: validateSkill passes with all required sections', () => {
  const metadata = {
    name: 'valid-skill',
    description: 'A valid description for testing',
    metadata: { openclaw: { emoji: '✅' } },
    emoji: '✅',
    requires: {},
    install: []
  };

  const body = `
## Purpose

This skill does X.

## When to Use

Use it for Y scenarios.

## Setup

Install and configure here.
`;

  const results = validateSkill(metadata, body);
  const sectionWarnings = results.filter(r => r.rule === 'missing-sections');
  assert.strictEqual(sectionWarnings.length, 0);
});
