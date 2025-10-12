#!/usr/bin/env node
/**
 * Add repository root to Docker Desktop's FilesharingDirectories and try to restart Docker Desktop.
 *
 * Supported platforms:
 * - macOS: ~/Library/Group Containers/group.com.docker/settings.json
 * - Windows: %APPDATA%/Docker/settings.json or %LOCALAPPDATA%/Docker/settings.json
 * - Linux (Docker Desktop): ~/.docker/desktop/settings.json
 *
 * Notes:
 * - Requires Docker Desktop. On Linux with plain dockerd (no Desktop), this setting does not apply.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function log(...args) {
  console.log('[docker-fileshare]', ...args);
}

function error(...args) {
  console.error('[docker-fileshare]', ...args);
}

function findSettingsPath() {
  const home = os.homedir();
  const candidates = [];
  const platform = process.platform; // 'darwin', 'win32', 'linux'

  if (platform === 'darwin') {
    candidates.push(path.join(home, 'Library', 'Group Containers', 'group.com.docker', 'settings-store.json'));
  } else if (platform === 'win32') {
    if (process.env.APPDATA) {
      candidates.push(path.join(process.env.APPDATA, 'Docker', 'settings.json'));
    }
    if (process.env.LOCALAPPDATA) {
      candidates.push(path.join(process.env.LOCALAPPDATA, 'Docker', 'settings.json'));
    }
  } else if (platform === 'linux') {
    candidates.push(path.join(home, '.docker', 'desktop', 'settings.json'));
  }

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function backupFile(filePath) {
  const backupPath = filePath + '.bak-' + new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function ensureArray(val) {
  return Array.isArray(val) ? val : [];
}

function updateSettings(settingsPath, repoRoot) {
  const raw = fs.readFileSync(settingsPath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${settingsPath}: ${e.message}`);
  }

  const current = ensureArray(json.FilesharingDirectories);
  const normalizedRepo = path.resolve(repoRoot);
  const has = current.some(p => path.resolve(p) === normalizedRepo);

  if (!has) {
    current.push(normalizedRepo);
    json.FilesharingDirectories = current;
  }

  const tmpPath = settingsPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(json, null, 2));
  fs.renameSync(tmpPath, settingsPath);
  return !has;
}

function tryRestartDockerDesktop() {
  const platform = process.platform;
  if (platform === 'darwin') {
    // Quit Docker.app then reopen
    try {
      spawnSync('osascript', ['-e', 'tell application "Docker" to quit'], { stdio: 'ignore' });
    } catch {}
    try {
      spawnSync('open', ['-a', 'Docker'], { stdio: 'ignore' });
      return true;
    } catch {}
    return false;
  }
  if (platform === 'win32') {
    try {
      // Best effort stop
      spawnSync('powershell', ['-NoProfile', '-Command', 'Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force'], { stdio: 'ignore' });
    } catch {}
    // Try to start Docker Desktop
    const candidates = [
      process.env["ProgramFiles"] && path.join(process.env["ProgramFiles"], 'Docker', 'Docker', 'Docker Desktop.exe'),
      process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], 'Docker', 'Docker', 'Docker Desktop.exe'),
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Docker', 'Docker', 'Docker Desktop.exe')
    ].filter(Boolean);
    for (const exe of candidates) {
      try {
        if (fs.existsSync(exe)) {
          spawnSync('powershell', ['-NoProfile', '-Command', `Start-Process -FilePath "${exe}"`], { stdio: 'ignore', detached: true });
          return true;
        }
      } catch {}
    }
    return false;
  }
  if (platform === 'linux') {
    // Try user service restart for Docker Desktop for Linux
    try {
      const r1 = spawnSync('systemctl', ['--user', 'restart', 'docker-desktop'], { stdio: 'ignore' });
      if (r1.status === 0) return true;
    } catch {}
    return false;
  }
  return false;
}

function main() {
  const repoRoot = path.resolve(path.join(__dirname, '..'));
  const settingsPath = findSettingsPath();
  if (!settingsPath) {
    error('Could not find Docker Desktop settings.json for this OS.');
    error('Please open Docker Desktop settings and add the repository root to File Sharing manually.');
    process.exitCode = 1;
    return;
  }

  try {
    backupFile(settingsPath);
  } catch (e) {
    error('Warning: failed to create backup of settings-store.json:', e.message);
  }

  try {
    updateSettings(settingsPath, repoRoot);
  } catch (e) {
    error(e.message);
    process.exitCode = 1;
    return;
  }

  log('Attempting to restart Docker Desktop to apply changes...');
  const restarted = tryRestartDockerDesktop();
  if (restarted) {
  } else {
    error('Could not automatically restart Docker Desktop. Please restart it manually to apply changes.');
  }
}

main();
