#!/usr/bin/env node
/*
  Update .env using AWS credential info from .aws/config.
  Behavior:
  - Read repository-local .aws/config (i.e., <repo>/.aws/config).
  - Error and exit if the file does not exist.
  - Find the first section header [profile XXXX].
    - Use XXXX as AWS_PROFILE.
    - Within the same section, read:
      - region -> AWS_REGION
      - sso_account_id -> AWS_ACCOUNT_ID
  - Replace or append these keys in .env.
  - Exit non-zero on errors.
*/

const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

function replaceOrAppend(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) return text.replace(re, line);
  const nl = text.endsWith('\n') ? '' : '\n';
  return text + nl + line + '\n';
}

function parseAwsConfig(text) {
  // Simple INI-like parser focusing on [profile NAME] sections
  const lines = text.split(/\r?\n/);
  let currentSection = null;
  const sections = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    const mSec = line.match(/^\[(.+?)\]$/);
    if (mSec) {
      currentSection = { name: mSec[1], keys: {} };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      const mKey = line.match(/^(\w[\w\-\._]*)\s*=\s*(.*)$/);
      if (mKey) {
        const k = mKey[1];
        const v = mKey[2].trim();
        currentSection.keys[k] = v;
      }
    }
  }

  return sections;
}

function main() {
  const repoRoot = process.cwd();
  const awsConfigPath = join(repoRoot, '.aws', 'config');
  const envPath = join(repoRoot, '.env');

  if (!existsSync(awsConfigPath)) {
    console.error('[apply-aws-cred] .aws/config not found. Aborting.');
    process.exit(1);
  }

  let cfgText;
  try {
    cfgText = readFileSync(awsConfigPath, 'utf-8');
  } catch (e) {
    console.error('[apply-aws-cred] Failed to read .aws/config:', e && e.message ? e.message : e);
    process.exit(1);
  }

  const sections = parseAwsConfig(cfgText);
  if (!sections.length) {
    console.error('[apply-aws-cred] No sections found in .aws/config.');
    process.exit(1);
  }

  // Find the first [profile XXXX]
  let target = null;
  for (const sec of sections) {
    if (sec.name.startsWith('profile ')) {
      target = sec;
      break;
    }
  }
  if (!target) {
    console.error('[apply-aws-cred] No [profile XXXX] section found in .aws/config.');
    process.exit(1);
  }

  const profileName = target.name.replace(/^profile\s+/, '').trim();
  const region = target.keys['region'];
  const accountId = target.keys['sso_account_id'];

  if (!profileName) {
    console.error('[apply-aws-cred] Profile name could not be determined from section header.');
    process.exit(1);
  }
  if (!region) {
    console.error('[apply-aws-cred] `region` not found in the selected profile section.');
    process.exit(1);
  }
  if (!accountId) {
    console.error('[apply-aws-cred] `sso_account_id` not found in the selected profile section.');
    process.exit(1);
  }

  // Read .env (must exist as the previous step creates it). If it doesn't, still attempt to create/update.
  let envText = '';
  if (existsSync(envPath)) {
    try {
      envText = readFileSync(envPath, 'utf-8');
    } catch (e) {
      console.error('[apply-aws-cred] Failed to read .env:', e && e.message ? e.message : e);
      process.exit(1);
    }
  }

  envText = replaceOrAppend(envText, 'AWS_REGION', region);
  envText = replaceOrAppend(envText, 'AWS_ACCOUNT_ID', accountId);
  envText = replaceOrAppend(envText, 'AWS_PROFILE', profileName);

  try {
    writeFileSync(envPath, envText, 'utf-8');
    console.log(`[apply-aws-cred] Updated .env with AWS_REGION=${region}, AWS_ACCOUNT_ID=${accountId}, AWS_PROFILE=${profileName}`);
  } catch (e) {
    console.error('[apply-aws-cred] Failed to write .env:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
