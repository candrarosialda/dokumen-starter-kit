import {
  ArrowDown,
  ArrowUp,
  Ban,
  CheckCircle2,
  Combine,
  Eye,
  FilePlus2,
  FolderOutput,
  LoaderCircle,
  Trash2,
  XCircle,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  openPdfFromPath,
} from '../../lib/openPdf'

import {
  useAppStore,
} from '../../store/useAppStore'

import {
  useJobStore,
} from '../../store/useJobStore'

import type {
  SelectedPdfFile,
} from '../../types/dialogs'

type MergePdfResult = {
  outputFile: string
  outputFileName: string
  inputCount: number
  pageCount: number
  sizeBytes: number
}

function isMergePdfResult(
  value: unknown,
): value is MergePdfResult {
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
    typeof candidate.inputCount ===
      'number' &&
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

export function MergePdfPanel() {
  const [
    files,
    setFiles,
  ] =
    useState<
      SelectedPdfFile[]
    >([])

  const [
    outputFile,
    setOutputFile,
  ] = useState('')

  const [
    mergeJobId,
    setMergeJobId,
  ] =
    useState<string | null>(
      null,
    )

  const setStatusMessage =
    useAppStore(
      (state) =>
        state.setStatusMessage,
    )

  const jobs =
    useJobStore(
      (state) => state.jobs,
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

  const mergeJob =
    mergeJobId
      ? jobs[mergeJobId] ??
        null
      : null

  const mergeResult =
    useMemo(
      () =>
        isMergePdfResult(
          mergeJob?.result,
        )
          ? mergeJob.result
          : null,
      [mergeJob?.result],
    )

  const isBusy =
    mergeJob?.status ===
      'queued' ||
    mergeJob?.status ===
      'running'

  const outputConflicts =
    useMemo(
      () =>
        Boolean(
          outputFile &&
            files.some(
              (file) =>
                file.filePath
                  .toLocaleLowerCase() ===
                outputFile
                  .toLocaleLowerCase(),
            ),
        ),
      [
        files,
        outputFile,
      ],
    )

  async function selectFiles(): Promise<void> {
    const selected =
      await window
        .desktopAPI
        .dialog
        .selectPdfFiles()

    if (
      selected.length === 0
    ) {
      return
    }

    setFiles(
      (currentFiles) => {
        const existingPaths =
          new Set(
            currentFiles.map(
              (file) =>
                file.filePath
                  .toLocaleLowerCase(),
            ),
          )

        const newFiles =
          selected.filter(
            (file) =>
              !existingPaths.has(
                file.filePath
                  .toLocaleLowerCase(),
              ),
          )

        return [
          ...currentFiles,
          ...newFiles,
        ]
      },
    )

    setStatusMessage(
      `${selected.length} file PDF dipilih.`,
    )
  }

  async function chooseOutput(): Promise<void> {
    const selectedOutput =
      await window
        .desktopAPI
        .dialog
        .saveMergedPdf(
          files[0]?.filePath,
        )

    if (!selectedOutput) {
      return
    }

    setOutputFile(
      selectedOutput,
    )

    setStatusMessage(
      'Lokasi output sudah dipilih.',
    )
  }

  function removeFile(
    index: number,
  ): void {
    setFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_, fileIndex) =>
            fileIndex !== index,
        ),
    )
  }

  function moveFile(
    index: number,
    direction: -1 | 1,
  ): void {
    setFiles(
      (currentFiles) => {
        const nextIndex =
          index + direction

        if (
          nextIndex < 0 ||
          nextIndex >=
            currentFiles.length
        ) {
          return currentFiles
        }

        const nextFiles = [
          ...currentFiles,
        ]

        const [
          movedFile,
        ] = nextFiles.splice(
          index,
          1,
        )

        nextFiles.splice(
          nextIndex,
          0,
          movedFile,
        )

        return nextFiles
      },
    )
  }

  async function runMerge(): Promise<void> {
    if (
      files.length < 2 ||
      !outputFile ||
      outputConflicts
    ) {
      return
    }

    if (
      mergeJobId &&
      mergeJob
    ) {
      clearJob(
        mergeJobId,
      )
    }

    try {
      setStatusMessage(
        'Memulai penggabungan PDF...',
      )

      const jobId =
        await startJob({
          kind: 'merge_pdf',

          payload: {
            inputFiles:
              files.map(
                (file) =>
                  file.filePath,
              ),

            outputFile,
          },
        })

      setMergeJobId(
        jobId,
      )
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Gagal memulai merge PDF.',
      )
    }
  }

  function resetMerge(): void {
    if (mergeJobId) {
      clearJob(
        mergeJobId,
      )
    }

    setMergeJobId(null)
    setFiles([])
    setOutputFile('')

    setStatusMessage(
      'Form merge PDF dibersihkan.',
    )
  }

  return (
    <section className="mx-auto max-w-6xl p-8 lg:p-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
          Page Organizer
        </p>

        <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-white">
          <Combine
            size={30}
            className="text-blue-400"
          />

          Gabungkan PDF
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Pilih minimal dua PDF,
          atur urutannya, kemudian
          simpan sebagai satu dokumen.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/55">
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div>
              <h2 className="font-semibold text-white">
                Daftar PDF
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Urutan dari atas akan
                menjadi urutan dokumen hasil.
              </p>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                void selectFiles()
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              <FilePlus2
                size={17}
              />

              Tambah PDF
            </button>
          </div>

          {files.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8">
              <div className="text-center">
                <Combine
                  size={46}
                  className="mx-auto text-slate-700"
                />

                <p className="mt-4 font-medium text-slate-400">
                  Belum ada PDF dipilih
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Tambahkan minimal dua
                  dokumen PDF.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {files.map(
                (
                  file,
                  index,
                ) => (
                  <div
                    key={
                      file.filePath
                    }
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-300">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {
                          file.fileName
                        }
                      </p>

                      <p className="mt-1 truncate text-[11px] text-slate-600">
                        {
                          file.filePath
                        }
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatFileSize(
                          file.sizeBytes,
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={
                          isBusy ||
                          index === 0
                        }
                        onClick={() =>
                          moveFile(
                            index,
                            -1,
                          )
                        }
                        className="toolbar-button"
                        title="Naikkan urutan"
                      >
                        <ArrowUp
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={
                          isBusy ||
                          index ===
                            files.length -
                              1
                        }
                        onClick={() =>
                          moveFile(
                            index,
                            1,
                          )
                        }
                        className="toolbar-button"
                        title="Turunkan urutan"
                      >
                        <ArrowDown
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          removeFile(
                            index,
                          )
                        }
                        className="toolbar-button text-red-300 hover:bg-red-500/10"
                        title="Hapus dari daftar"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
            <h2 className="font-semibold text-white">
              File hasil
            </h2>

            <button
              type="button"
              disabled={
                isBusy ||
                files.length === 0
              }
              onClick={() =>
                void chooseOutput()
              }
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              <FolderOutput
                size={17}
              />

              Pilih Lokasi Output
            </button>

            <div className="mt-3 min-h-16 rounded-xl bg-slate-900/70 p-3 text-xs">
              {outputFile ? (
                <p className="break-all text-slate-300">
                  {outputFile}
                </p>
              ) : (
                <p className="text-slate-600">
                  Lokasi output belum dipilih.
                </p>
              )}
            </div>

            {outputConflicts && (
              <p className="mt-3 text-xs leading-5 text-red-300">
                File output tidak boleh
                sama dengan salah satu
                file input.
              </p>
            )}

            <button
              type="button"
              disabled={
                isBusy ||
                files.length < 2 ||
                !outputFile ||
                outputConflicts
              }
              onClick={() =>
                void runMerge()
              }
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isBusy ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Combine
                  size={18}
                />
              )}

              Gabungkan PDF
            </button>
          </div>

          {mergeJob && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
              <div className="flex items-center gap-2">
                {(
                  mergeJob.status ===
                    'queued' ||
                  mergeJob.status ===
                    'running'
                ) && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin text-blue-400"
                  />
                )}

                {mergeJob.status ===
                  'completed' && (
                  <CheckCircle2
                    size={18}
                    className="text-emerald-400"
                  />
                )}

                {mergeJob.status ===
                  'failed' && (
                  <XCircle
                    size={18}
                    className="text-red-400"
                  />
                )}

                {mergeJob.status ===
                  'cancelled' && (
                  <Ban
                    size={18}
                    className="text-amber-400"
                  />
                )}

                <p className="text-sm font-semibold text-slate-200">
                  {
                    mergeJob.message
                  }
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                  style={{
                    width:
                      `${mergeJob.progress}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-right font-mono text-xs text-slate-500">
                {
                  mergeJob.progress
                }
                %
              </p>

              {mergeJob.error && (
                <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs leading-5 text-red-300">
                  {
                    mergeJob.error
                  }
                </p>
              )}

              {mergeResult && (
                <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-200">
                  <p>
                    {
                      mergeResult.inputCount
                    }
                    {' '}
                    file digabungkan.
                  </p>

                  <p className="mt-1">
                    {
                      mergeResult.pageCount
                    }
                    {' '}
                    halaman.
                  </p>

                  <p className="mt-1">
                    Ukuran:
                    {' '}
                    {formatFileSize(
                      mergeResult.sizeBytes,
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void openPdfFromPath(
                        mergeResult.outputFile,
                        mergeResult.outputFileName,
                      )
                    }
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    <Eye size={16} />
                    Buka Hasil
                  </button>
                </div>
              )}

              {isBusy && (
                <button
                  type="button"
                  onClick={() => {
                    if (mergeJobId) {
                      void cancelJob(
                        mergeJobId,
                      )
                    }
                  }}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                >
                  <Ban size={16} />
                  Batalkan
                </button>
              )}

              {!isBusy && (
                <button
                  type="button"
                  onClick={
                    resetMerge
                  }
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-white/5"
                >
                  <Trash2
                    size={16}
                  />

                  Bersihkan
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}