import {
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from 'electron'

import {
  stat,
} from 'node:fs/promises'

import path from 'node:path'

import type {
  SelectedOrganizerAsset,
  SelectedPdfFile,
} from '../types/dialogs.js'

function getOwnerWindow(
  event: IpcMainInvokeEvent,
): BrowserWindow | null {
  return BrowserWindow.fromWebContents(
    event.sender,
  )
}

async function showPdfOpenDialog(
  event: IpcMainInvokeEvent,
) {
  const options: OpenDialogOptions = {
    title: 'Pilih PDF untuk digabungkan',

    properties: [
      'openFile',
      'multiSelections',
    ],

    filters: [
      {
        name: 'PDF Document',
        extensions: ['pdf'],
      },
    ],
  }

  const owner =
    getOwnerWindow(event)

  return owner
    ? dialog.showOpenDialog(
        owner,
        options,
      )
    : dialog.showOpenDialog(
        options,
      )
}

async function showPdfSaveDialog(
  event: IpcMainInvokeEvent,
  sourceFilePath?: string,
) {
  let defaultPath =
    'hasil-gabungan.pdf'

  if (
    sourceFilePath &&
    typeof sourceFilePath ===
      'string'
  ) {
    const sourceDirectory =
      path.dirname(
        sourceFilePath,
      )

    const sourceName =
      path.basename(
        sourceFilePath,
        path.extname(
          sourceFilePath,
        ),
      )

    defaultPath = path.join(
      sourceDirectory,
      `${sourceName}-merged.pdf`,
    )
  }

  const options: SaveDialogOptions = {
    title:
      'Simpan hasil gabungan PDF',

    defaultPath,

    filters: [
      {
        name: 'PDF Document',
        extensions: ['pdf'],
      },
    ],
  }

  const owner =
    getOwnerWindow(event)

  return owner
    ? dialog.showSaveDialog(
        owner,
        options,
      )
    : dialog.showSaveDialog(
        options,
      )
}

function ensurePdfExtension(
  filePath: string,
): string {
  return path.extname(
    filePath,
  ).toLowerCase() === '.pdf'
    ? filePath
    : `${filePath}.pdf`
}

async function showOrganizedPdfSaveDialog(
  event: IpcMainInvokeEvent,
  sourceFilePath?: string,
) {
  let defaultPath =
    'hasil-organize.pdf'

  if (
    sourceFilePath &&
    typeof sourceFilePath ===
      'string'
  ) {
    const sourceDirectory =
      path.dirname(
        sourceFilePath,
      )

    const sourceName =
      path.basename(
        sourceFilePath,
        path.extname(
          sourceFilePath,
        ),
      )

    defaultPath = path.join(
      sourceDirectory,
      `${sourceName}-organized.pdf`,
    )
  }

  const options:
    SaveDialogOptions = {
      title:
        'Simpan hasil pengaturan halaman',

      defaultPath,

      filters: [
        {
          name:
            'PDF Document',

          extensions: [
            'pdf',
          ],
        },
      ],
    }

  const owner =
    getOwnerWindow(event)

  return owner
    ? dialog.showSaveDialog(
        owner,
        options,
      )
    : dialog.showSaveDialog(
        options,
      )
}

export function registerFileDialogHandlers(): void {
  ipcMain.handle(
    'dialog:select-pdf-files',
    async (
      event,
    ): Promise<SelectedPdfFile[]> => {
      const result =
        await showPdfOpenDialog(
          event,
        )

      if (
        result.canceled ||
        result.filePaths.length === 0
      ) {
        return []
      }

      return Promise.all(
        result.filePaths.map(
          async (
            filePath,
          ): Promise<SelectedPdfFile> => {
            const fileStat =
              await stat(filePath)

            return {
              filePath,
              fileName:
                path.basename(
                  filePath,
                ),
              sizeBytes:
                fileStat.size,
            }
          },
        ),
      )
    },
  )

  ipcMain.handle(
    'dialog:select-organizer-assets',

    async (
      event,
    ): Promise<SelectedOrganizerAsset[]> => {
      const options: OpenDialogOptions = {
        title:
          'Tambahkan PDF atau gambar',

        properties: [
          'openFile',
          'multiSelections',
        ],

        filters: [
          {
            name:
              'PDF dan Gambar',

            extensions: [
              'pdf',
              'jpg',
              'jpeg',
              'png',
            ],
          },

          {
            name:
              'PDF Document',

            extensions: ['pdf'],
          },

          {
            name:
              'Image',

            extensions: [
              'jpg',
              'jpeg',
              'png',
            ],
          },
        ],
      }

      const owner =
        getOwnerWindow(event)

      const result = owner
        ? await dialog.showOpenDialog(
            owner,
            options,
          )
        : await dialog.showOpenDialog(
            options,
          )

      if (
        result.canceled ||
        result.filePaths.length === 0
      ) {
        return []
      }

      const supportedExtensions =
        new Set([
          '.pdf',
          '.jpg',
          '.jpeg',
          '.png',
        ])

      const assets:
        SelectedOrganizerAsset[] = []

      for (
        const filePath of
        result.filePaths
      ) {
        const extension =
          path
            .extname(filePath)
            .toLocaleLowerCase()

        if (
          !supportedExtensions.has(
            extension,
          )
        ) {
          continue
        }

        const fileStat =
          await stat(filePath)

        assets.push({
          filePath,

          fileName:
            path.basename(
              filePath,
            ),

          sizeBytes:
            fileStat.size,

          extension,

          kind:
            extension === '.pdf'
              ? 'pdf'
              : 'image',
        })
      }

      return assets
    },
  )

  ipcMain.handle(
    'dialog:save-merged-pdf',
    async (
      event,
      sourceFilePath?: unknown,
    ): Promise<string | null> => {
      const safeSourcePath =
        typeof sourceFilePath ===
        'string'
          ? sourceFilePath
          : undefined

      const result =
        await showPdfSaveDialog(
          event,
          safeSourcePath,
        )

      if (
        result.canceled ||
        !result.filePath
      ) {
        return null
      }

      return ensurePdfExtension(
        result.filePath,
      )
    },
  )

  ipcMain.handle(
    'dialog:save-organized-pdf',

    async (
      event,
      sourceFilePath?: unknown,
    ): Promise<string | null> => {
      const safeSourcePath =
        typeof sourceFilePath ===
        'string'
          ? sourceFilePath
          : undefined

      const result =
        await showOrganizedPdfSaveDialog(
          event,
          safeSourcePath,
        )

      if (
        result.canceled ||
        !result.filePath
      ) {
        return null
      }

      return ensurePdfExtension(
        result.filePath,
      )
    },
  )
}