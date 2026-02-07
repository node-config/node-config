'use strict';

const { describe, it } = require('node:test');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const tscPath = require.resolve('typescript/bin/tsc');

function truncateOutput(output, maxLines) {
  const lines = output.split(/\r?\n/);
  if (lines.length <= maxLines) {
    return output;
  }
  const tail = lines.slice(-maxLines).join('\n');
  return `... (truncated, showing last ${maxLines} of ${lines.length} lines)\n${tail}`;
}

function runTsc(tsconfigPath, label) {
  const result = spawnSync(process.execPath, [tscPath, '-p', tsconfigPath], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const stdout = (result.stdout || '').trim();
    const stderr = (result.stderr || '').trim();
    const output = [stdout, stderr].filter(Boolean).join('\n');
    const trimmed = output ? truncateOutput(output, 40) : '';
    const context = label ? ` (${label})` : '';
    const message = output
      ? `TypeScript failed${context} for ${tsconfigPath}:\n${trimmed}`
      : `TypeScript failed${context} for ${tsconfigPath} with exit code ${result.status}`;
    throw new Error(message);
  }
}

describe('TypeScript declaration checks', function () {
  it('builds declarations and typechecks public API fixtures', function () {
    runTsc(path.join(repoRoot, 'tsconfig.json'), 'build declarations');
    runTsc(path.join(repoRoot, 'test', 'types', 'tsconfig.json'), 'typecheck fixtures');
  });
});
