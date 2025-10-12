#!/usr/bin/env node
/*
  Apply .gitconfig_example to the repository's local Git config (.git/config).
  - Reads keys from .gitconfig_example via `git config -f`.
  - Applies them with `git config --local --replace-all` (idempotent).
*/

const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
  return res;
}

function main() {
  const repoRoot = process.cwd();
  const gitDir = join(repoRoot, '.git');
  const examplePath = join(repoRoot, '.gitconfig_example');

  if (!existsSync(gitDir)) {
    console.warn('[apply-gitconfig] .git directory not found. Skipping.');
    process.exit(0);
  }
  if (!existsSync(examplePath)) {
    console.warn('[apply-gitconfig] .gitconfig_example not found. Skipping.');
    process.exit(0);
  }

  // Ensure git is available
  const v = run('git', ['--version']);
  if (v.status !== 0) {
    console.warn('[apply-gitconfig] git not available. Skipping.');
    process.exit(0);
  }

  // Read list of key=value pairs from the example file
  const list = run('git', ['config', '-f', examplePath, '--list']);
  if (list.status !== 0) {
    console.error('[apply-gitconfig] Failed to read .gitconfig_example:', list.stderr || list.stdout);
    process.exit(list.status || 1);
  }

  const lines = (list.stdout || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('#'));

  if (lines.length === 0) {
    console.log('[apply-gitconfig] No entries found in .gitconfig_example. Nothing to apply.');
    process.exit(0);
  }

  let applied = 0;
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1); // keep value as-is, may contain spaces

    // Use --replace-all to ensure idempotency
    const setRes = run('git', ['config', '--local', '--replace-all', key, value]);
    if (setRes.status !== 0) {
      // Surface an informative message but continue
      const msg = (setRes.stderr || setRes.stdout || '').trim();
      console.warn(`[apply-gitconfig] Failed to set ${key}. ${msg}`);
    } else {
      applied += 1;
    }
  }

  console.log(`[apply-gitconfig] Applied ${applied} entries from .gitconfig_example to .git/config (local).`);
}

main();
