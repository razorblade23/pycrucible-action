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

async function download(url: string, dest: string): Promise<void> {
  const file = createWriteStream(dest)
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }
      streamPipeline(response, file).then(resolve).catch(reject)
    }).on('error', reject)
  })
}

run()
