import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as os from 'os'
import * as https from 'https'
import { createWriteStream, mkdirSync, chmodSync } from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'
import path from 'path'

const streamPipeline = promisify(pipeline)

async function run(): Promise<void> {
  try {
    const entry = core.getInput('entry') || '.'
    const output = core.getInput('output') || 'dist/app'
    const versionInput = core.getInput('version')

    const platformUrl: Record<string, string> = {
            win32: 'https://github.com/razorblade23/PyCrucible/releases/download/v0.3.0-pypi-fix3/pycrucible_v0.3.0-pypi-fix3_x86_64-pc-windows-msvc.exe',
            linux: 'https://github.com/razorblade23/PyCrucible/releases/download/v0.3.0-pypi-fix3/pycrucible_v0.3.0-pypi-fix3_x86_64-unknown-linux-gnu',
            darwin: 'https://github.com/razorblade23/PyCrucible/releases/download/v0.3.0-pypi-fix3/pycrucible_v0.3.0-pypi-fix3_x86_64-apple-darwin',
        };

    const platform = os.platform()
    const binUrl = platformUrl[platform]
    if (!binUrl) throw new Error(`Unsupported platform: ${platform}`)

    const binDir = path.join(process.cwd(), 'pycrucible_bin')
    const binPath = path.join(binDir, platform === 'win32' ? 'pycrucible.exe' : 'pycrucible')

    mkdirSync(binDir, { recursive: true })
    await download(binUrl, binPath)
    chmodSync(binPath, 0o755)

    await exec.exec(binPath, ['-e', entry, '-o', output])
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

async function download(url: string, dest: string, redirectCount = 0): Promise<void> {
  if (redirectCount > 10) {
    throw new Error(`Too many redirects for ${url}`);
  }

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const status = response.statusCode ?? 0;

      // Handle redirect (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(status)) {
        const location = response.headers.location;
        if (!location) {
          reject(new Error(`Redirect status ${status} with no Location header for ${url}`));
          return;
        }
        // Resolve relative redirects
        const newUrl = new URL(location, url).toString();
        response.resume(); // discard data
        download(newUrl, dest, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      if (status !== 200) {
        reject(new Error(`Failed to download ${url}: ${status}`));
        return;
      }

      const file = createWriteStream(dest);
      streamPipeline(response, file).then(resolve).catch(reject);
    }).on("error", reject);
  });
}

run()
