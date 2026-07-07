import {
  contextBridge,
  ipcRenderer,
  type IpcRendererEvent,
} from 'electron'

import type {
  CancelJobResponse,
  JobEvent,
  JobRequest,
  StartJobResponse,
} from './types/rendererJobs.js'

import type {
  SelectedPdfFile,
  SelectedOrganizerAsset,
} from './types/dialogs.js'

contextBridge.exposeInMainWorld('desktopAPI', {
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximizeToggle: (): Promise<boolean> => ipcRenderer.invoke('window:maximize-toggle'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
  },
  dialog: {
    openPdf: (): Promise<{
      filePath: string
      fileName: string
    } | null> =>
      ipcRenderer.invoke(
        'dialog:open-pdf',
      ),

    selectPdfFiles:
      (): Promise<
        SelectedPdfFile[]
      > =>
        ipcRenderer.invoke(
          'dialog:select-pdf-files',
        ),

    saveMergedPdf: (
      sourceFilePath?: string,
    ): Promise<string | null> =>
      ipcRenderer.invoke(
        'dialog:save-merged-pdf',
        sourceFilePath,
      ),
    
    saveOrganizedPdf: (
      sourceFilePath?: string,
    ): Promise<string | null> =>
      ipcRenderer.invoke(
        'dialog:save-organized-pdf',
        sourceFilePath,
      ),

    selectOrganizerAssets:
    (): Promise<SelectedOrganizerAsset[]> =>
      ipcRenderer.invoke(
        'dialog:select-organizer-assets',
      ),
  },
  file: {
    readPdf: (filePath: string): Promise<Uint8Array> =>
      ipcRenderer.invoke('file:read-pdf', filePath),
    readImageDataUrl: (
          filePath: string,
        ): Promise<string> =>
          ipcRenderer.invoke(
            'file:read-image-data-url',
            filePath,
          ),
  },

  python: {
    healthCheck: (): Promise<{ ok: boolean; engine: string; version: string }> =>
      ipcRenderer.invoke('python:health-check'),
  },
  jobs: {
    start: (
      request: JobRequest,
    ): Promise<StartJobResponse> =>
      ipcRenderer.invoke(
        'jobs:start',
        request,
      ),

    cancel: (
      jobId: string,
    ): Promise<CancelJobResponse> =>
      ipcRenderer.invoke(
        'jobs:cancel',
        jobId,
      ),

    onEvent: (
      callback: (
        event: JobEvent,
      ) => void,
    ): (() => void) => {
      const listener = (
        _event: IpcRendererEvent,
        payload: JobEvent,
      ) => {
        callback(payload)
      }

      ipcRenderer.on(
        'jobs:event',
        listener,
      )

      /*
      * React memanggil fungsi ini
      * saat komponen dilepas.
      */
      return () => {
        ipcRenderer.removeListener(
          'jobs:event',
          listener,
        )
      }
    },
  },
})
