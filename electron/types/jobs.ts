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

export type PythonJobMessage =
  | {
      type: 'progress'
      progress: number
      message: string
    }
  | {
      type: 'result'
      progress?: number
      message: string
      result?: unknown
    }
  | {
      type: 'error'
      progress?: number
      message: string
      error?: string
    }