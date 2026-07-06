export {}

import type {
  CancelJobResponse,
  JobEvent,
  JobRequest,
  StartJobResponse,
} from './jobs'

import type {
  SelectedPdfFile,
} from './dialogs'

type SelectedPdf = {
  filePath: string
  fileName: string
}

type PythonHealth = {
  ok: boolean
  engine: string
  version: string
}

declare global {
  interface Window {
    desktopAPI: {
      app: {
        getVersion: () => Promise<string>
      }
      window: {
        minimize: () => Promise<void>
        maximizeToggle: () => Promise<boolean>
        isMaximized: () => Promise<boolean>
        close: () => Promise<void>
      }
      dialog: {
        openPdf: () =>
          Promise<SelectedPdf | null>

        selectPdfFiles: () =>
          Promise<SelectedPdfFile[]>

        saveMergedPdf: (
          sourceFilePath?: string,
        ) => Promise<string | null>

        saveOrganizedPdf: (
          sourceFilePath?: string,
        ) => Promise<string | null>
      }
      file: {
        readPdf: (
          filePath: string,
        ) => Promise<Uint8Array>

        readImageDataUrl: (
          filePath: string,
        ) => Promise<string>
      }
      python: {
        healthCheck: () => Promise<PythonHealth>
      }
      jobs: {
        start: (
          request: JobRequest,
        ) => Promise<StartJobResponse>

        cancel: (
          jobId: string,
        ) => Promise<CancelJobResponse>

        onEvent: (
          callback: (
            event: JobEvent,
          ) => void,
        ) => () => void
      }
    }
  }
}
