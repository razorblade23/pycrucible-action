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

    const platformMap: Record<string, string> = {
            win32: 'pycrucible_v0.3.0-pypi-fix3_x86_64-pc-windows-msvc.exe',
            linux: 'pycrucible_v0.3.0-pypi-fix3_x86_64-unknown-linux-gnu',
            darwin: 'pycrucible_v0.3.0-pypi-fix3_x86_64-apple-darwin',
        };

    const platform = os.platform()
    const asset = platformMap[platform]
    if (!asset) throw new Error(`Unsupported platform: ${platform}`)

    const version = versionInput || await getLatestRelease()
    const binUrl = `https://github.com/razorblade23/PyCrucible/releases/download/v0.3.0-pypi-fix3/${asset}`
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

async function getLatestRelease(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(
      'https://api.github.com/repos/razorblade23/PyCrucible/releases/latest',
      { headers: { 'User-Agent': 'pycrucible-action' } },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.tag_name)
          } catch (e) {
            reject('Failed to parse GitHub API response.')
          }
        })
      }
    ).on('error', reject)
  })
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
