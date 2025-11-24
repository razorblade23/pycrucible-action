import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const entry = core.getInput('entry') || '.'
    const output = core.getInput('output') || 'dist/app'
    const versionInput = core.getInput('version') || 'pycrucible'

    // Install PyCrucible (optionally pinned)
    if (versionInput === 'latest') {
      await exec.exec('python3', ['-m', 'pip', 'install', 'pycrucible'])
    } else {
      await exec.exec('python3', ['-m', 'pip', 'install', `pycrucible==${versionInput}`])
    }

    // Run PyCrucible CLI
    await exec.exec('pycrucible', ['-e', entry, '-o', output])
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()
