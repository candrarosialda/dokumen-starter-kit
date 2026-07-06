import {
  create,
} from 'zustand'

import type {
  JobEvent,
  JobRequest,
} from '../types/jobs'

type JobState = {
  jobs: Record<
    string,
    JobEvent
  >

  activeJobId: string | null

  startJob: (
    request: JobRequest,
  ) => Promise<string>

  cancelJob: (
    jobId: string,
  ) => Promise<boolean>

  applyEvent: (
    event: JobEvent,
  ) => void

  clearJob: (
    jobId: string,
  ) => void
}

export const useJobStore =
  create<JobState>(
    (set) => ({
      jobs: {},
      activeJobId: null,

      startJob:
        async (request) => {
          const response =
            await window
              .desktopAPI
              .jobs
              .start(request)

          set((state) => ({
            activeJobId:
              response.jobId,

            /*
             * Event queued mungkin datang
             * sebelum Promise start selesai.
             */
            jobs:
              state.jobs[
                response.jobId
              ]
                ? state.jobs
                : {
                    ...state.jobs,

                    [response.jobId]:
                      {
                        jobId:
                          response.jobId,

                        kind:
                          request.kind,

                        status:
                          'queued',

                        progress: 0,

                        message:
                          'Menunggu Python engine.',
                      },
                  },
          }))

          return response.jobId
        },

      cancelJob:
        async (jobId) => {
          const response =
            await window
              .desktopAPI
              .jobs
              .cancel(jobId)

          return response.cancelled
        },

      applyEvent: (event) => {
        set((state) => ({
          activeJobId:
            event.jobId,

          jobs: {
            ...state.jobs,

            [event.jobId]:
              event,
          },
        }))
      },

      clearJob: (jobId) => {
        set((state) => {
          const nextJobs = {
            ...state.jobs,
          }

          delete nextJobs[
            jobId
          ]

          return {
            jobs: nextJobs,

            activeJobId:
              state.activeJobId ===
              jobId
                ? null
                : state.activeJobId,
          }
        })
      },
    }),
  )