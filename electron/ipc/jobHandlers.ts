import {
  ipcMain,
} from 'electron'

import {
  jobManager,
} from '../services/jobManager.js'

export function registerJobHandlers(): void {
  ipcMain.handle(
    'jobs:start',
    (
      event,
      request: unknown,
    ) => {
      const jobId =
        jobManager.start(
          request,
          event.sender,
        )

      return {
        jobId,
      }
    },
  )

  ipcMain.handle(
    'jobs:cancel',
    (
      event,
      jobId: unknown,
    ) => {
      if (
        typeof jobId !==
          'string' ||
        !jobId
      ) {
        throw new Error(
          'Job ID tidak valid.',
        )
      }

      return {
        jobId,

        cancelled:
          jobManager.cancel(
            jobId,
            event.sender.id,
          ),
      }
    },
  )
}