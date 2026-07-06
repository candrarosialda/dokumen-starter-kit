import { app } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'

export type PythonCommand = {
  command: string
  args: string[]
}

function getDevelopmentVenvPython(): string {
  if (process.platform === 'win32') {
    return path.join(
      app.getAppPath(),
      '.venv',
      'Scripts',
      'python.exe',
    )
  }

  return path.join(
    app.getAppPath(),
    '.venv',
    'bin',
    'python',
  )
}

export function getPythonCommand(): PythonCommand {
  /*
   * Selama development, prioritaskan
   * Python dari virtual environment proyek.
   */
  if (!app.isPackaged) {
    const venvPython =
      getDevelopmentVenvPython()

    if (existsSync(venvPython)) {
      return {
        command: venvPython,
        args: [],
      }
    }
  }

  /*
   * Fallback apabila .venv belum tersedia.
   */
  if (process.platform === 'win32') {
    return {
      command: 'py',
      args: ['-3'],
    }
  }

  return {
    command: 'python3',
    args: [],
  }
}

export function getPythonEnginePath(): string {
  return app.isPackaged
    ? path.join(
        process.resourcesPath,
        'python-engine',
        'main.py',
      )
    : path.join(
        app.getAppPath(),
        'python-engine',
        'main.py',
      )
}