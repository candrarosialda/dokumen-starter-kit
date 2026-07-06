import {
  spawn,
  type ChildProcessWithoutNullStreams,
} from 'node:child_process'

import {
  createInterface,
} from 'node:readline'

import type {
  JobRequest,
  PythonJobMessage,
} from '../types/jobs.js'

import {
  getPythonCommand,
  getPythonEnginePath,
} from './pythonEnvironment.js'

export type PythonProcessClose = {
  code: number | null
  signal: NodeJS.Signals | null
  stderr: string
}

export type PythonJobCallbacks = {
  onMessage: (
    message: PythonJobMessage,
  ) => void

  onProcessError: (
    error: Error,
  ) => void

  onClose: (
    details: PythonProcessClose,
  ) => void
}

export type RunningPythonJob = {
  process: ChildProcessWithoutNullStreams
  cancel: () => void
}

function isPythonJobMessage(
  value: unknown,
): value is PythonJobMessage {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const candidate =
    value as Record<string, unknown>

  return (
    (
      candidate.type === 'progress' ||
      candidate.type === 'result' ||
      candidate.type === 'error'
    ) &&
    typeof candidate.message === 'string'
  )
}

function terminateProcessTree(
  child: ChildProcessWithoutNullStreams,
): void {
  if (
    child.killed ||
    !child.pid
  ) {
    return
  }

  /*
   * Windows membutuhkan taskkill /T
   * untuk menghentikan process tree.
   */
  if (process.platform === 'win32') {
    const killer = spawn(
      'taskkill',
      [
        '/pid',
        String(child.pid),
        '/T',
        '/F',
      ],
      {
        windowsHide: true,
        stdio: 'ignore',
      },
    )

    killer.once('error', () => {
      child.kill()
    })

    return
  }

  child.kill('SIGTERM')
}

export function startPythonJob(
  request: JobRequest,
  callbacks: PythonJobCallbacks,
): RunningPythonJob {
  const python =
    getPythonCommand()

  const scriptPath =
    getPythonEnginePath()

  const child = spawn(
    python.command,
    [
      ...python.args,
      scriptPath,
      '--run-job',
    ],
    {
      windowsHide: true,

      /*
       * stdin untuk mengirim request.
       * stdout untuk progress dan hasil.
       * stderr untuk error internal.
       */
      stdio: [
        'pipe',
        'pipe',
        'pipe',
      ],
    },
  )

  let stderr = ''

  /*
   * Setiap baris stdout Python
   * merupakan satu object JSON.
   */
  const outputReader =
    createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    })

  outputReader.on(
    'line',
    (line) => {
      const trimmedLine =
        line.trim()

      if (!trimmedLine) {
        return
      }

      try {
        const parsed: unknown =
          JSON.parse(trimmedLine)

        if (
          !isPythonJobMessage(
            parsed,
          )
        ) {
          callbacks.onProcessError(
            new Error(
              `Pesan Python tidak dikenali: ${trimmedLine}`,
            ),
          )

          return
        }

        callbacks.onMessage(
          parsed,
        )
      } catch {
        callbacks.onProcessError(
          new Error(
            `Output Python bukan JSON valid: ${trimmedLine}`,
          ),
        )
      }
    },
  )

  child.stderr.on(
    'data',
    (chunk: Buffer) => {
      stderr +=
        chunk.toString('utf8')
    },
  )

  child.once(
    'error',
    (error) => {
      callbacks.onProcessError(
        error,
      )
    },
  )

  child.once(
    'close',
    (code, signal) => {
      outputReader.close()

      callbacks.onClose({
        code,
        signal,
        stderr,
      })
    },
  )

  /*
   * Request dikirim melalui stdin,
   * bukan dimasukkan ke command line.
   */
  child.stdin.end(
    `${JSON.stringify(request)}\n`,
    'utf8',
  )

  return {
    process: child,

    cancel: () => {
      terminateProcessTree(
        child,
      )
    },
  }
}