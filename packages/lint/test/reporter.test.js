import test from 'node:test';
import assert from 'node:assert';
import { reportResults } from '../src/reporter.js';

test('Reporter: reportResults returns 0 for no issues', () => {
  const exitCode = reportResults('/path/to/SKILL.md', [], { quiet: true });
  assert.strictEqual(exitCode, 0);
});

test('Reporter: reportResults returns 1 for errors', () => {
  const results = [
    {
      severity: 'error',
      rule: 'test-error',
      message: 'Test error message'
    }
  ];

  const exitCode = reportResults('/path/to/SKILL.md', results, { quiet: true });
  assert.strictEqual(exitCode, 1);
});

test('Reporter: reportResults returns 0 for warnings only', () => {
  const results = [
    {
      severity: 'warning',
      rule: 'test-warning',
      message: 'Test warning message'
    }
  ];

  const exitCode = reportResults('/path/to/SKILL.md', results, { quiet: true });
  assert.strictEqual(exitCode, 0);
});

test('Reporter: reportResults returns 0 for info only', () => {
  const results = [
    {
      severity: 'info',
      rule: 'test-info',
      message: 'Test info message'
    }
  ];

  const exitCode = reportResults('/path/to/SKILL.md', results, { quiet: true });
  assert.strictEqual(exitCode, 0);
});

test('Reporter: reportResults handles multiple result types', () => {
  const results = [
    {
      severity: 'error',
      rule: 'test-error',
      message: 'Test error message'
    },
    {
      severity: 'warning',
      rule: 'test-warning',
      message: 'Test warning message'
    },
    {
      severity: 'info',
      rule: 'test-info',
      message: 'Test info message'
    }
  ];

  const exitCode = reportResults('/path/to/SKILL.md', results, { quiet: true });
  assert.strictEqual(exitCode, 1);
});
