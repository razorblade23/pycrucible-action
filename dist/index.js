const core = require('@actions/core');
const exec = require('@actions/exec');
const os = require('os');
const https = require('https');
const { createWriteStream, mkdirSync, chmodSync } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const path = require('path');

const streamPipeline = promisify(pipeline);

async function run() {
  try {
    const entry = core.getInput('entry') || '.';
    const output = core.getInput('output') || 'dist/app';
    const versionInput = core.getInput('version');

    const platformMap = {
      win32: 'windows.exe',
      linux: 'linux',
      darwin: 'x86_64-apple-darwin'
    };

    const platform = os.platform();
    const asset = platformMap[platform];
    if (!asset) throw new Error(`Unsupported platform: ${platform}`);

    const version = versionInput || await getLatestRelease();
    const binUrl = `https://github.com/razorblade23/PyCrucible/releases/download/${version}/pycrucible-${asset}`;
    const binDir = path.join(process.cwd(), 'pycrucible_bin');
    const binPath = path.join(binDir, platform === 'win32' ? 'pycrucible.exe' : 'pycrucible');

    mkdirSync(binDir, { recursive: true });
    await download(binUrl, binPath);
    chmodSync(binPath, 0o755);

    await exec.exec(binPath, ['-e', entry, '-o', output]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getLatestRelease() {
  return new Promise((resolve, reject) => {
    https.get(
      'https://api.github.com/repos/razorblade23/PyCrucible/releases/latest',
      { headers: { 'User-Agent': 'pycrucible-action' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.tag_name);
          } catch (e) {
            reject('Failed to parse GitHub API response.');
          }
        });
      }
    ).on('error', reject);
  });
}

async function download(url, dest) {
  const file = createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      streamPipeline(response, file).then(resolve).catch(reject);
    }).on('error', reject);
  });
}

run();
