#!/usr/bin/env node
/*
  Create .env from .env_example if it does not exist, after generating API key materials.
  - Idempotent: if .env exists, do nothing.
  - Runs `yarn openapi:genkey` to obtain passphrase, salt, and code.
  - Writes these into .env as:
    - APP1_API_KEY_PASSPHRASE=<passphrase>
    - APP1_API_KEY_SALT=<salt>
    - APP1_API_KEY=["<code>"]  (reset to empty array conceptually, then append one element)
  - Copies permissions from the example file.
*/

const { existsSync, statSync, chmodSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

function printGenkeyOutputBanner(jsonText) {
  const isTTY = process.stderr.isTTY;
  const bold = isTTY ? "\x1b[1m" : "";
  const yellow = isTTY ? "\x1b[33m" : "";
  const reset = isTTY ? "\x1b[0m" : "";
  let highlighted = jsonText;
  if (isTTY && typeof jsonText === 'string') {
    try {
      // Emphasize only the apiKey field's value inside the JSON text
      highlighted = jsonText.replace(/("apiKey"\s*:\s*)("([^"\\]|\\.)*")/g, (m, p1, p2) => {
        return p1 + bold + yellow + p2 + reset;
      });
    } catch (_) {
      // If anything goes wrong, fall back to original text without modifications
      highlighted = jsonText;
    }
  }
  // Remove all double-quote characters from the displayed output only (does not affect JSON parsing)
  const withoutQuotes = typeof highlighted === 'string' ? highlighted.replace(/"/g, '') : highlighted;
  console.error(`\n${bold}${yellow}[apply-env] GENKEY OUTPUT${reset}\n${withoutQuotes}\n`);
}

function replaceOrAppend(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) {
    return text.replace(re, line);
  }
  const nl = text.endsWith('\n') ? '' : '\n';
  return text + nl + line + '\n';
}

function main() {
  const repoRoot = process.cwd();
  const example = join(repoRoot, '.env_example');
  const target = join(repoRoot, '.env');

  if (!existsSync(example)) {
    console.warn('[apply-env] .env_example not found. Skipping.');
    process.exit(0);
  }

  if (existsSync(target)) {
    console.log('[apply-env] .env already exists. Skipping creation.');
    process.exit(0);
  }

  // 1) Generate key materials
  console.log('[apply-env] Generating API key materials via `yarn openapi:genkey`...');
  const gen = spawnSync(process.platform === 'win32' ? 'yarn.cmd' : 'yarn', ['openapi:genkey'], {
    encoding: 'utf-8',
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (gen.status !== 0) {
    console.error('[apply-env] Failed to run yarn openapi:genkey');
    if (gen.stderr) console.error(gen.stderr.trim());
    process.exit(1);
  }
  let passphrase, salt, code;
  try {
    const out = (gen.stdout || '').trim();
    const jsonStart = out.indexOf('{');
    const jsonText = jsonStart >= 0 ? out.slice(jsonStart) : out; // in case of extra logs
    printGenkeyOutputBanner(jsonText);
    const payload = JSON.parse(jsonText);
    passphrase = payload.passphrase;
    salt = payload.salt;
    code = payload.code;
    if (!passphrase || !salt || !code) throw new Error('missing fields in genkey output');
  } catch (e) {
    console.error('[apply-env] Could not parse output from yarn openapi:genkey:', e && e.message ? e.message : e);
    process.exit(1);
  }

  // 2) Build .env contents from example
  let envText = '';
  try {
    envText = readFileSync(example, 'utf-8');
  } catch (e) {
    console.error('[apply-env] Failed to read .env_example:', e && e.message ? e.message : e);
    process.exit(1);
  }

  // Ensure APP1_API_KEY is reset to array then add our code (final line becomes ["code"]).
  envText = replaceOrAppend(envText, 'APP1_API_KEY_PASSPHRASE', passphrase);
  envText = replaceOrAppend(envText, 'APP1_API_KEY_SALT', salt);
  // First reset to empty array if key exists
  const keyRe = /^APP1_API_KEY=.*$/m;
  if (keyRe.test(envText)) {
    envText = envText.replace(keyRe, 'APP1_API_KEY=[]');
  } else {
    envText = replaceOrAppend(envText, 'APP1_API_KEY', '[]');
  }
  // Then append our code (resulting value with a single element)
  envText = envText.replace(/^APP1_API_KEY=\[\]$/m, `APP1_API_KEY=["${code}"]`);

  // 3) Write .env and copy permissions
  try {
    writeFileSync(target, envText, 'utf-8');
    try {
      const st = statSync(example);
      chmodSync(target, st.mode);
    } catch (_) {}
    console.log('[apply-env] Created .env from .env_example with generated API key materials');
  } catch (e) {
    console.error('[apply-env] Failed to create .env:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
