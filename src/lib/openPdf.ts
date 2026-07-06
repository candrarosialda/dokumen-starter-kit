import {
  normalizeDocumentPath,
  useAppStore,
} from '../store/useAppStore'

function getFileNameFromPath(
  filePath: string,
): string {
  return (
    filePath
      .split(/[\\/]/)
      .pop() ||
    'document.pdf'
  )
}

export async function openPdfFromPath(
  filePath: string,

  fileName =
    getFileNameFromPath(
      filePath,
    ),
): Promise<void> {
  const state =
    useAppStore.getState()

  try {
    const normalizedPath =
      normalizeDocumentPath(
        filePath,
      )

    const existingDocument =
      state.documents.find(
        (document) =>
          normalizeDocumentPath(
            document.filePath,
          ) === normalizedPath,
      )

    /*
     * Jika dokumen mempunyai perubahan
     * yang belum disimpan, jangan baca ulang
     * file dari disk.
     */
    if (
      existingDocument?.isDirty
    ) {
      state.activateDocument(
        existingDocument.id,
      )

      state.setWorkspace(
        'viewer',
      )

      state.setStatusMessage(
        `${fileName} sudah terbuka dan memiliki perubahan.`,
      )

      return
    }

    state.setStatusMessage(
      `Membaca ${fileName}...`,
    )

    const data =
      await window
        .desktopAPI
        .file
        .readPdf(filePath)

    /*
     * Jika tab sudah ada, segarkan datanya
     * agar hasil merge atau perubahan file
     * dari luar dapat ditampilkan.
     */
    if (existingDocument) {
      state.replaceDocumentData(
        existingDocument.id,
        data,
      )

      state.activateDocument(
        existingDocument.id,
      )
    } else {
      state.openDocument({
        filePath,
        fileName,
        data,
      })
    }

    state.setWorkspace(
      'viewer',
    )

    state.setStatusMessage(
      `${fileName} siap ditampilkan`,
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal membuka PDF.'

    useAppStore
      .getState()
      .setStatusMessage(
        message,
      )

    throw error
  }
}

export async function openPdfFromDialog(): Promise<void> {
  const setStatusMessage =
    useAppStore
      .getState()
      .setStatusMessage

  try {
    setStatusMessage(
      'Memilih dokumen...',
    )

    const selected =
      await window
        .desktopAPI
        .dialog
        .openPdf()

    if (!selected) {
      setStatusMessage(
        'Pemilihan file dibatalkan',
      )

      return
    }

    await openPdfFromPath(
      selected.filePath,
      selected.fileName,
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal membuka PDF.'

    setStatusMessage(message)
  }
}