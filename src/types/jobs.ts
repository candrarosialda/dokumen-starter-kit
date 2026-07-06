export type JobKind =
  | 'demo'
  | 'merge_pdf'
  | 'organize_pdf'

export type JobRequest = {
  kind: JobKind
  payload: Record<string, unknown>
}

export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type JobEvent = {
  jobId: string
  kind: JobKind
  status: JobStatus
  progress: number
  message: string
  result?: unknown
  error?: string
}

export type StartJobResponse = {
  jobId: string
}

export type CancelJobResponse = {
  jobId: string
  cancelled: boolean
}