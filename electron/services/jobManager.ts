import {
  randomUUID,
} from 'node:crypto'

import type {
  WebContents,
} from 'electron'

import type {
  JobEvent,
  JobRequest,
  PythonJobMessage,
} from '../types/jobs.js'

import {
  startPythonJob,
  type RunningPythonJob,
} from './pythonRunner.js'

type RunningJob = {
  jobId: string
  kind: JobRequest['kind']
  owner: WebContents
  runner: RunningPythonJob
  settled: boolean
}

function clampProgress(
  progress: unknown,
): number {
  if (
    typeof progress !== 'number' ||
    Number.isNaN(progress)
  ) {
    return 0
  }

  return Math.min(
    Math.max(
      Math.round(progress),
      0,
    ),
    100,
  )
}

function assertJobRequest(
  request: unknown,
): asserts request is JobRequest {
  if (
    !request ||
    typeof request !== 'object'
  ) {
    throw new Error(
      'Permintaan job tidak valid.',
    )
  }

  const candidate =
    request as Record<
      string,
      unknown
    >

  /*
   * Saat ini baru demo.
   * Nanti ditambahkan merge_pdf,
   * compress_pdf, dan lainnya.
   */
  if (
    candidate.kind !==
      'demo' &&
    candidate.kind !==
      'merge_pdf' &&
    candidate.kind !==
      'organize_pdf'
  ) {
    throw new Error(
      'Jenis job belum didukung.',
    )
  }

  if (
    !candidate.payload ||
    typeof candidate.payload !==
      'object'
  ) {
    throw new Error(
      'Payload job tidak valid.',
    )
  }
}

class JobManager {
  private readonly jobs =
    new Map<
      string,
      RunningJob
    >()

  start(
    requestValue: unknown,
    owner: WebContents,
  ): string {
    assertJobRequest(
      requestValue,
    )

    const request =
      requestValue

    const jobId =
      randomUUID()

    this.emit(owner, {
      jobId,
      kind: request.kind,
      status: 'queued',
      progress: 0,
      message:
        'Pekerjaan masuk antrean.',
    })

    let runningJob:
      RunningJob

    const runner =
      startPythonJob(
        request,
        {
          onMessage: (
            message,
          ) => {
            runningJob =
              this.jobs.get(
                jobId,
              ) as RunningJob

            if (
              !runningJob ||
              runningJob.settled
            ) {
              return
            }

            this.handlePythonMessage(
              runningJob,
              message,
            )
          },

          onProcessError: (
            error,
          ) => {
            runningJob =
              this.jobs.get(
                jobId,
              ) as RunningJob

            if (
              !runningJob ||
              runningJob.settled
            ) {
              return
            }

            this.fail(
              runningJob,
              error.message,
            )
          },

          onClose: ({
            code,
            signal,
            stderr,
          }) => {
            runningJob =
              this.jobs.get(
                jobId,
              ) as RunningJob

            /*
             * Job completed atau failed
             * sudah dihapus dari Map.
             */
            if (
              !runningJob ||
              runningJob.settled
            ) {
              return
            }

            const reason =
              stderr.trim()
                ? stderr.trim()
                : (
                    'Python berhenti tanpa hasil. ' +
                    `Code: ${String(code)}, ` +
                    `signal: ${String(signal)}`
                  )

            this.fail(
              runningJob,
              reason,
            )
          },
        },
      )

    runningJob = {
      jobId,
      kind: request.kind,
      owner,
      runner,
      settled: false,
    }

    this.jobs.set(
      jobId,
      runningJob,
    )

    this.emit(owner, {
      jobId,
      kind: request.kind,
      status: 'running',
      progress: 0,
      message:
        'Python engine mulai bekerja.',
    })

    return jobId
  }

  cancel(
    jobId: string,
    ownerId: number,
  ): boolean {
    const job =
      this.jobs.get(jobId)

    if (
      !job ||
      job.owner.id !== ownerId ||
      job.settled
    ) {
      return false
    }

    job.settled = true
    job.runner.cancel()

    this.emit(job.owner, {
      jobId: job.jobId,
      kind: job.kind,
      status: 'cancelled',
      progress: 0,
      message:
        'Pekerjaan dibatalkan.',
    })

    this.jobs.delete(
      jobId,
    )

    return true
  }

  cancelAll(): void {
    for (
      const job of
      this.jobs.values()
    ) {
      if (!job.settled) {
        job.settled = true
        job.runner.cancel()
      }
    }

    this.jobs.clear()
  }

  private handlePythonMessage(
    job: RunningJob,
    message: PythonJobMessage,
  ): void {
    if (
      message.type ===
      'progress'
    ) {
      this.emit(job.owner, {
        jobId: job.jobId,
        kind: job.kind,
        status: 'running',
        progress:
          clampProgress(
            message.progress,
          ),
        message:
          message.message,
      })

      return
    }

    if (
      message.type ===
      'result'
    ) {
      job.settled = true

      this.emit(job.owner, {
        jobId: job.jobId,
        kind: job.kind,
        status: 'completed',

        progress:
          clampProgress(
            message.progress ??
              100,
          ),

        message:
          message.message,

        result:
          message.result,
      })

      this.jobs.delete(
        job.jobId,
      )

      return
    }

    job.settled = true

    this.emit(job.owner, {
      jobId: job.jobId,
      kind: job.kind,
      status: 'failed',

      progress:
        clampProgress(
          message.progress,
        ),

      message:
        message.message,

      error:
        message.error ??
        message.message,
    })

    this.jobs.delete(
      job.jobId,
    )
  }

  private fail(
    job: RunningJob,
    error: string,
  ): void {
    job.settled = true

    this.emit(job.owner, {
      jobId: job.jobId,
      kind: job.kind,
      status: 'failed',
      progress: 0,

      message:
        'Python engine mengalami kesalahan.',

      error,
    })

    this.jobs.delete(
      job.jobId,
    )
  }

  private emit(
    owner: WebContents,
    event: JobEvent,
  ): void {
    if (
      owner.isDestroyed()
    ) {
      return
    }

    owner.send(
      'jobs:event',
      event,
    )
  }
}

export const jobManager =
  new JobManager()