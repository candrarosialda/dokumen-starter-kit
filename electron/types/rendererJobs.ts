import type {
  JobEvent,
  JobRequest,
} from './jobs.js'

export type {
  JobEvent,
  JobRequest,
}

export type StartJobResponse = {
  jobId: string
}

export type CancelJobResponse = {
  jobId: string
  cancelled: boolean
}