import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CheckSquare2,
  Eye,
  FilePlus2,
  FolderOutput,
  LoaderCircle,
  RotateCcw,
  RotateCw,
  Save,
  Square,
  Trash2,
  Undo2,
  XCircle,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getDocument,
  type PDFDocumentProxy,
} from 'pdfjs-dist'

import {
  openPdfFromPath,
} from '../../lib/openPdf'

import {
  selectActiveDocument,
  useAppStore,
} from '../../store/useAppStore'

import {
  useJobStore,
} from '../../store/useJobStore'

import {
  useOrganizerStore,
} from '../../store/useOrganizerStore'

import {
  normalizeDocumentPath,
} from '../../store/useAppStore'

import {
  OrganizerPageCard,
} from './components/OrganizerPageCard'

import '../viewer/lib/pdfWorker'

type OrganizePdfResult = {
  outputFile: string
  outputFileName: string
  pageCount: number
  sizeBytes: number
}

function isOrganizePdfResult(
  value: unknown,
): value is OrganizePdfResult {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const candidate =
    value as Record<
      string,
      unknown
    >

  return (
    typeof candidate.outputFile ===
      'string' &&
    typeof candidate.outputFileName ===
      'string' &&
    typeof candidate.pageCount ===
      'number' &&
    typeof candidate.sizeBytes ===
      'number'
  )
}

function formatFileSize(
  sizeBytes: number,
): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} byte`
  }

  if (
    sizeBytes <
    1024 * 1024
  ) {
    return (
      `${(
        sizeBytes / 1024
      ).toFixed(1)} KB`
    )
  }

  return (
    `${(
      sizeBytes /
      1024 /
      1024
    ).toFixed(2)} MB`
  )
}

export function PageOrganizerPanel() {
  const activeDocument =
    useAppStore(
      selectActiveDocument,
    )

  const setWorkspace =
    useAppStore(
      (state) =>
        state.setWorkspace,
    )

  const setStatusMessage =
    useAppStore(
      (state) =>
        state.setStatusMessage,
    )

  const [
    pdfDocument,
    setPdfDocument,
  ] =
    useState<
      PDFDocumentProxy | null
    >(null)

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const [
    loadError,
    setLoadError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    organizeJobId,
    setOrganizeJobId,
  ] =
    useState<string | null>(
      null,
    )

  const session =
    useOrganizerStore(
      (state) =>
        activeDocument
          ? state.sessions[
              activeDocument.id
            ]
          : undefined,
    )

  const initializeSession =
    useOrganizerStore(
      (state) =>
        state.initializeSession,
    )

  const setOutputFile =
    useOrganizerStore(
      (state) =>
        state.setOutputFile,
    )

  const togglePageSelection =
    useOrganizerStore(
      (state) =>
        state.togglePageSelection,
    )

  const selectAllPages =
    useOrganizerStore(
      (state) =>
        state.selectAllPages,
    )

  const clearSelection =
    useOrganizerStore(
      (state) =>
        state.clearSelection,
    )

  const rotateSelectedPages =
    useOrganizerStore(
      (state) =>
        state.rotateSelectedPages,
    )

  const deleteSelectedPages =
    useOrganizerStore(
      (state) =>
        state.deleteSelectedPages,
    )

  const deletePage =
    useOrganizerStore(
      (state) =>
        state.deletePage,
    )

  const rotatePage =
    useOrganizerStore(
      (state) =>
        state.rotatePage,
    )

  const movePage =
    useOrganizerStore(
      (state) =>
        state.movePage,
    )

  const restoreSession =
    useOrganizerStore(
      (state) =>
        state.restoreSession,
    )

  const jobs =
    useJobStore(
      (state) =>
        state.jobs,
    )

  const startJob =
    useJobStore(
      (state) =>
        state.startJob,
    )

  const cancelJob =
    useJobStore(
      (state) =>
        state.cancelJob,
    )

  const clearJob =
    useJobStore(
      (state) =>
        state.clearJob,
    )

  const organizeJob =
    organizeJobId
      ? jobs[
          organizeJobId
        ] ?? null
      : null

  const organizeResult =
    useMemo(
      () =>
        isOrganizePdfResult(
          organizeJob?.result,
        )
          ? organizeJob.result
          : null,
      [
        organizeJob?.result,
      ],
    )

  const isBusy =
    organizeJob?.status ===
      'queued' ||
    organizeJob?.status ===
      'running'

  const pages =
    session?.pages ?? []

  const selectedIds =
    session?.selectedPageIds ??
    []

  const allSelected =
    pages.length > 0 &&
    selectedIds.length ===
      pages.length

  const outputConflicts =
    Boolean(
      activeDocument &&
      session?.outputFile &&
      normalizeDocumentPath(
        activeDocument.filePath,
      ) ===
        normalizeDocumentPath(
          session.outputFile,
        ),
    )

  useEffect(() => {
    if (!activeDocument) {
      setPdfDocument(null)
      return
    }

    const pdfData =
      new Uint8Array(
        activeDocument.data,
      )

    const loadingTask =
      getDocument({
        data: pdfData,
      })

    let disposed = false

    setIsLoading(true)
    setLoadError(null)
    setPdfDocument(null)

    void loadingTask.promise
      .then(
        (loadedDocument) => {
          if (disposed) {
            return
          }

          setPdfDocument(
            loadedDocument,
          )

          initializeSession(
            activeDocument.id,
            loadedDocument.numPages,
          )
        },
      )
      .catch(
        (error: unknown) => {
          if (disposed) {
            return
          }

          setLoadError(
            error instanceof Error
              ? error.message
              : 'PDF gagal dimuat.',
          )
        },
      )
      .finally(() => {
        if (!disposed) {
          setIsLoading(false)
        }
      })

    return () => {
      disposed = true
      void loadingTask.destroy()
    }
  }, [
    activeDocument,
    initializeSession,
  ])

  useEffect(() => {
    const handleKeyboard = (
      event: KeyboardEvent,
    ): void => {
      const target =
        event.target

      if (
        target instanceof
          HTMLInputElement ||
        target instanceof
          HTMLTextAreaElement
      ) {
        return
      }

      if (
        !activeDocument ||
        !session ||
        isBusy
      ) {
        return
      }

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key
          .toLocaleLowerCase() ===
          'a'
      ) {
        event.preventDefault()

        selectAllPages(
          activeDocument.id,
        )

        return
      }

      if (
        event.key ===
          'Delete' &&
        selectedIds.length > 0
      ) {
        event.preventDefault()

        deleteSelectedPages(
          activeDocument.id,
        )
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyboard,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyboard,
      )
    }
  }, [
    activeDocument,
    deleteSelectedPages,
    isBusy,
    selectAllPages,
    selectedIds.length,
    session,
  ])

  async function chooseSource(): Promise<void> {
    const selected =
      await window
        .desktopAPI
        .dialog
        .openPdf()

    if (!selected) {
      return
    }

    await openPdfFromPath(
      selected.filePath,
      selected.fileName,
    )

    setWorkspace(
      'organize',
    )
  }

  async function chooseOutput(): Promise<void> {
    if (!activeDocument) {
      return
    }

    const selectedOutput =
      await window
        .desktopAPI
        .dialog
        .saveOrganizedPdf(
          activeDocument.filePath,
        )

    if (!selectedOutput) {
      return
    }

    setOutputFile(
      activeDocument.id,
      selectedOutput,
    )
  }

  async function runOrganizer(): Promise<void> {
    if (
      !activeDocument ||
      !session ||
      pages.length === 0 ||
      !session.outputFile ||
      outputConflicts
    ) {
      return
    }

    if (
      organizeJobId &&
      organizeJob
    ) {
      clearJob(
        organizeJobId,
      )
    }

    try {
      setStatusMessage(
        'Memulai penyimpanan halaman...',
      )

      const jobId =
        await startJob({
          kind:
            'organize_pdf',

          payload: {
            sourceFile:
              activeDocument.filePath,

            outputFile:
              session.outputFile,

            pages:
              pages.map(
                (page) => ({
                  pageNumber:
                    page.pageNumber,

                  rotation:
                    page.rotation,
                }),
              ),
          },
        })

      setOrganizeJobId(
        jobId,
      )
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Gagal memulai organizer.',
      )
    }
  }

  if (!activeDocument) {
    return (
      <div className="grid min-h-full place-items-center p-8">
        <div className="max-w-md rounded-3xl border border-dashed border-slate-700 bg-slate-950/55 p-10 text-center">
          <FilePlus2
            size={48}
            className="mx-auto text-slate-700"
          />

          <h2 className="mt-5 text-xl font-bold text-white">
            Pilih PDF yang akan diatur
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buka PDF untuk mengubah urutan,
            rotasi, atau menghapus halaman.
          </p>

          <button
            type="button"
            onClick={() =>
              void chooseSource()
            }
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <FilePlus2
              size={18}
            />

            Buka PDF
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-white">
              {
                activeDocument.fileName
              }
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              {pages.length}
              {' '}
              halaman tersisa
              {' • '}
              {selectedIds.length}
              {' '}
              dipilih
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                allSelected
                  ? clearSelection(
                      activeDocument.id,
                    )
                  : selectAllPages(
                      activeDocument.id,
                    )
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              {allSelected ? (
                <Square
                  size={15}
                />
              ) : (
                <CheckSquare2
                  size={15}
                />
              )}

              {allSelected
                ? 'Batal Pilih'
                : 'Pilih Semua'}
            </button>

            <button
              type="button"
              disabled={
                isBusy ||
                selectedIds.length ===
                  0
              }
              onClick={() =>
                rotateSelectedPages(
                  activeDocument.id,
                  -90,
                )
              }
              className="toolbar-button !h-9 !w-9"
              title="Putar halaman terpilih ke kiri"
            >
              <RotateCcw
                size={16}
              />
            </button>

            <button
              type="button"
              disabled={
                isBusy ||
                selectedIds.length ===
                  0
              }
              onClick={() =>
                rotateSelectedPages(
                  activeDocument.id,
                  90,
                )
              }
              className="toolbar-button !h-9 !w-9"
              title="Putar halaman terpilih ke kanan"
            >
              <RotateCw
                size={16}
              />
            </button>

            <button
              type="button"
              disabled={
                isBusy ||
                selectedIds.length ===
                  0
              }
              onClick={() =>
                deleteSelectedPages(
                  activeDocument.id,
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-40"
            >
              <Trash2
                size={15}
              />

              Hapus
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                restoreSession(
                  activeDocument.id,
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              <Undo2
                size={15}
              />

              Reset
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                void chooseSource()
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              <FilePlus2
                size={15}
              />

              Buka PDF Lain
            </button>
          </div>
        </div>
      </div>

      <div className="grid flex-1 gap-6 p-6 xl:grid-cols-[1fr_320px]">
        <div>
          {isLoading && (
            <div className="grid min-h-96 place-items-center">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />

                Memuat halaman PDF...
              </div>
            </div>
          )}

          {!isLoading &&
            loadError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={20}
                    className="shrink-0"
                  />

                  <p>
                    {loadError}
                  </p>
                </div>
              </div>
            )}

          {!isLoading &&
            !loadError &&
            pages.length === 0 && (
              <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-red-500/30 bg-red-500/5">
                <div className="text-center">
                  <Trash2
                    size={42}
                    className="mx-auto text-red-400/50"
                  />

                  <p className="mt-4 font-semibold text-red-300">
                    Semua halaman dihapus
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      restoreSession(
                        activeDocument.id,
                      )
                    }
                    className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
                  >
                    Kembalikan halaman
                  </button>
                </div>
              </div>
            )}

          {!isLoading &&
            pdfDocument &&
            pages.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {pages.map(
                  (
                    page,
                    index,
                  ) => (
                    <OrganizerPageCard
                      key={page.id}
                      pdfDocument={
                        pdfDocument
                      }
                      item={page}
                      displayIndex={
                        index + 1
                      }
                      selected={
                        selectedIds.includes(
                          page.id,
                        )
                      }
                      onToggle={() =>
                        togglePageSelection(
                          activeDocument.id,
                          page.id,
                        )
                      }
                      onRotateLeft={() =>
                        rotatePage(
                          activeDocument.id,
                          page.id,
                          -90,
                        )
                      }
                      onRotateRight={() =>
                        rotatePage(
                          activeDocument.id,
                          page.id,
                          90,
                        )
                      }
                      onDelete={() =>
                        deletePage(
                          activeDocument.id,
                          page.id,
                        )
                      }
                      onDropPage={(
                        draggedId,
                        targetId,
                      ) =>
                        movePage(
                          activeDocument.id,
                          draggedId,
                          targetId,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
        </div>

        <aside className="space-y-5">
          <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h2 className="font-semibold text-white">
              Simpan Hasil
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Dokumen sumber tidak akan
              diubah. Hasil disimpan sebagai
              file baru.
            </p>

            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                void chooseOutput()
              }
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"
            >
              <FolderOutput
                size={17}
              />

              Pilih Lokasi
            </button>

            <div className="mt-3 min-h-16 rounded-xl bg-slate-900/70 p-3 text-xs">
              {session?.outputFile ? (
                <p className="break-all text-slate-300">
                  {
                    session.outputFile
                  }
                </p>
              ) : (
                <p className="text-slate-600">
                  Lokasi output belum dipilih.
                </p>
              )}
            </div>

            {outputConflicts && (
              <p className="mt-3 text-xs leading-5 text-red-300">
                File hasil tidak boleh
                menimpa PDF sumber.
              </p>
            )}

            <button
              type="button"
              disabled={
                isBusy ||
                pages.length === 0 ||
                !session?.outputFile ||
                outputConflicts
              }
              onClick={() =>
                void runOrganizer()
              }
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isBusy ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={18}
                />
              )}

              Simpan PDF Baru
            </button>

            {organizeJob && (
              <div className="mt-5 border-t border-slate-800 pt-5">
                <div className="flex items-center gap-2">
                  {(
                    organizeJob.status ===
                      'queued' ||
                    organizeJob.status ===
                      'running'
                  ) && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin text-blue-400"
                    />
                  )}

                  {organizeJob.status ===
                    'completed' && (
                    <CheckCircle2
                      size={17}
                      className="text-emerald-400"
                    />
                  )}

                  {organizeJob.status ===
                    'failed' && (
                    <XCircle
                      size={17}
                      className="text-red-400"
                    />
                  )}

                  {organizeJob.status ===
                    'cancelled' && (
                    <Ban
                      size={17}
                      className="text-amber-400"
                    />
                  )}

                  <span className="text-xs text-slate-300">
                    {
                      organizeJob.message
                    }
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-[width]"
                    style={{
                      width:
                        `${organizeJob.progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-right font-mono text-xs text-slate-500">
                  {
                    organizeJob.progress
                  }
                  %
                </p>

                {organizeJob.error && (
                  <p className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-300">
                    {
                      organizeJob.error
                    }
                  </p>
                )}

                {organizeResult && (
                  <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-200">
                    <p>
                      {
                        organizeResult.pageCount
                      }
                      {' '}
                      halaman tersimpan.
                    </p>

                    <p className="mt-1">
                      Ukuran:
                      {' '}
                      {formatFileSize(
                        organizeResult.sizeBytes,
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void openPdfFromPath(
                          organizeResult.outputFile,
                          organizeResult.outputFileName,
                        )
                      }
                      className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      <Eye
                        size={16}
                      />

                      Buka Hasil
                    </button>
                  </div>
                )}

                {isBusy && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        organizeJobId
                      ) {
                        void cancelJob(
                          organizeJobId,
                        )
                      }
                    }}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                  >
                    <Ban
                      size={16}
                    />

                    Batalkan
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}