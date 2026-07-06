import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  LoaderCircle,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getDocument,
  type PDFDocumentProxy,
} from 'pdfjs-dist'

import { clsx } from 'clsx'

import {
  openPdfFromDialog,
} from '../../lib/openPdf'

import {
  selectActiveDocument,
  useAppStore,
} from '../../store/useAppStore'

import {
  MAX_VIEWER_SCALE,
  MIN_VIEWER_SCALE,
  VIEWER_SCALE_STEP,
  useViewerStore,
  type FitMode,
} from '../../store/useViewerStore'

import {
  PdfPageCanvas,
} from './components/PdfPageCanvas'

import {
  PdfSearchBar,
} from './components/PdfSearchBar'

import {
  usePdfSearch,
} from './hooks/usePdfSearch'

import {
  ThumbnailPanel,
} from './components/ThumbnailPanel'

import './lib/pdfWorker'

export function ViewerPage() {
  const activeDocument =
  useAppStore(
    selectActiveDocument,
  )

  const setStatusMessage =
    useAppStore(
      (state) =>
        state.setStatusMessage,
    )

  const pageNumber =
    useViewerStore(
      (state) =>
        state.pageNumber,
    )

  const scale =
    useViewerStore(
      (state) => state.scale,
    )

  const rotation =
    useViewerStore(
      (state) =>
        state.rotation,
    )

  const fitMode =
    useViewerStore(
      (state) =>
        state.fitMode,
    )

  const setPageNumber =
    useViewerStore(
      (state) =>
        state.setPageNumber,
    )

  const setViewScale =
    useViewerStore(
      (state) =>
        state.setViewScale,
    )

  const rotateClockwise =
    useViewerStore(
      (state) =>
        state.rotateClockwise,
    )

  const resetView =
    useViewerStore(
      (state) =>
        state.resetView,
    )

  const viewerContainerRef =
    useRef<HTMLDivElement>(null)

  const [
    pdfDocument,
    setPdfDocument,
  ] =
    useState<PDFDocumentProxy | null>(
      null,
    )

  const [
    pageInput,
    setPageInput,
  ] = useState('1')

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(null)

  const {
    query,
    setQuery,

    searchedQuery,
    matches,
    activeMatch,
    activeMatchIndex,

    isSearching,
    searchProgress,
    searchError,

    runSearch,
    nextMatch,
    previousMatch,
    clearSearch,
    } = usePdfSearch(
      pdfDocument,
    )

  const currentPageMatches =
    useMemo(
      () =>
        matches.filter(
          (match) =>
            match.pageNumber ===
            pageNumber,
        ),
      [
        matches,
        pageNumber,
      ],
    )

  useEffect(() => {
    setPageInput(
      String(pageNumber),
    )
  }, [pageNumber])

  useEffect(() => {
    if (!activeMatch) {
      return
    }

    setPageNumber(
        activeMatch.pageNumber,
      )
    }, [
      activeMatch,
      setPageNumber,
    ])

    useEffect(() => {
    if (searchError) {
      setStatusMessage(
        `Pencarian gagal: ${searchError}`,
      )

      return
    }

    if (
      !isSearching &&
      searchedQuery
    ) {
      setStatusMessage(
        matches.length > 0
          ? `Ditemukan ${matches.length} hasil untuk “${searchedQuery}”`
          : `Teks “${searchedQuery}” tidak ditemukan`,
      )
    }
  }, [
    isSearching,
    matches.length,
    searchError,
    searchedQuery,
    setStatusMessage,
  ])

  /*
   * Membuka data PDF dari Electron
   * ke PDF.js.
   */
  useEffect(() => {
    const sourceData =
      activeDocument?.data

    if (
      !activeDocument ||
      !sourceData
    ) {
      setPdfDocument(null)
      return
    }

    /*
     * Selalu buat salinan Uint8Array
     * sebelum diberikan ke worker PDF.js.
     */
    const pdfData =
      new Uint8Array(sourceData)

    const loadingTask =
      getDocument({
        data: pdfData,
      })

    let disposed = false

    resetView()
    setIsLoading(true)
    setErrorMessage(null)
    setPdfDocument(null)

    void loadingTask.promise
      .then((loadedPdf) => {
        if (disposed) {
          return
        }

        setPdfDocument(
          loadedPdf,
        )

        setStatusMessage(
          `${activeDocument.fileName} dibuka — ${loadedPdf.numPages} halaman`,
        )
      })
      .catch(
        (error: unknown) => {
          if (disposed) {
            return
          }

          const message =
            error instanceof Error
              ? error.message
              : 'PDF gagal dimuat oleh PDF.js.'

          setErrorMessage(
            message,
          )

          setStatusMessage(
            `Gagal membuka PDF: ${message}`,
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
    resetView,
    setStatusMessage,
  ])

  const changePage =
    useCallback(
      (
        nextPage: number,
      ): void => {
        if (!pdfDocument) {
          return
        }

        const safePage =
          Math.min(
            Math.max(
              Math.trunc(
                nextPage,
              ),
              1,
            ),
            pdfDocument.numPages,
          )

        setPageNumber(
          safePage,
        )
      },
      [
        pdfDocument,
        setPageNumber,
      ],
    )

  const changeScale =
    useCallback(
      (
        nextScale: number,
      ): void => {
        setViewScale(
          nextScale,
          'custom',
        )
      },
      [setViewScale],
    )

  /*
   * Menghitung zoom berdasarkan
   * ukuran area viewer.
   */
  const fitTo =
    useCallback(
      async (
        mode: Exclude<
          FitMode,
          'custom'
        >,
      ): Promise<void> => {
        const container =
          viewerContainerRef.current

        if (
          !pdfDocument ||
          !container
        ) {
          return
        }

        const page =
          await pdfDocument.getPage(
            pageNumber,
          )

        const effectiveRotation =
          (
            page.rotate +
            rotation
          ) % 360

        const viewport =
          page.getViewport({
            scale: 1,
            rotation:
              effectiveRotation,
          })

        /*
         * Padding diberikan agar canvas
         * tidak menempel ke tepi viewer.
         */
        const horizontalPadding =
          64

        const verticalPadding =
          64

        const availableWidth =
          Math.max(
            container.clientWidth -
              horizontalPadding,
            160,
          )

        const availableHeight =
          Math.max(
            container.clientHeight -
              verticalPadding,
            160,
          )

        const widthScale =
          availableWidth /
          viewport.width

        const heightScale =
          availableHeight /
          viewport.height

        const nextScale =
          mode === 'width'
            ? widthScale
            : Math.min(
                widthScale,
                heightScale,
              )

        setViewScale(
          nextScale,
          mode,
        )
      },
      [
        pageNumber,
        pdfDocument,
        rotation,
        setViewScale,
      ],
    )

  const commitPageInput =
    useCallback((): void => {
      const parsedPage =
        Number.parseInt(
          pageInput,
          10,
        )

      if (
        Number.isNaN(
          parsedPage,
        )
      ) {
        setPageInput(
          String(pageNumber),
        )

        return
      }

      changePage(
        parsedPage,
      )
    }, [
      changePage,
      pageInput,
      pageNumber,
    ])

  /*
   * Shortcut keyboard viewer.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ): void => {
      const target =
        event.target

      if (
        target instanceof
          HTMLInputElement ||
        target instanceof
          HTMLTextAreaElement ||
        target instanceof
          HTMLSelectElement
      ) {
        return
      }

      if (
        event.key ===
          'ArrowLeft' ||
        event.key === 'PageUp'
      ) {
        event.preventDefault()

        changePage(
          pageNumber - 1,
        )

        return
      }

      if (
        event.key ===
          'ArrowRight' ||
        event.key ===
          'PageDown'
      ) {
        event.preventDefault()

        changePage(
          pageNumber + 1,
        )

        return
      }

      if (
        !event.ctrlKey &&
        !event.metaKey
      ) {
        return
      }

      if (
        event.key === '+' ||
        event.key === '='
      ) {
        event.preventDefault()

        changeScale(
          scale +
            VIEWER_SCALE_STEP,
        )

        return
      }

      if (
        event.key === '-'
      ) {
        event.preventDefault()

        changeScale(
          scale -
            VIEWER_SCALE_STEP,
        )

        return
      }

      if (
        event.key === '0'
      ) {
        event.preventDefault()
        void fitTo('page')
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    changePage,
    changeScale,
    fitTo,
    pageNumber,
    scale,
  ])

  if (!activeDocument) {
    return (
      <section className="grid h-full min-h-0 place-items-center p-8">
        <div className="max-w-md rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center">
          <FileText
            className="mx-auto text-slate-600"
            size={48}
          />

          <h2 className="mt-5 text-xl font-bold">
            Belum ada PDF aktif
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Pilih dokumen PDF
            untuk menampilkannya
            di area viewer.
          </p>

          <button
            type="button"
            onClick={() =>
              void openPdfFromDialog()
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500"
          >
            <FolderOpen
              size={17}
            />

            Buka PDF
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/60 px-5 py-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {
              activeDocument.fileName
            }
          </h2>

          <p className="truncate text-[11px] text-slate-500">
            {pdfDocument
              ? `${pdfDocument.numPages} halaman`
              : isLoading
                ? 'Membaca struktur PDF...'
                : 'PDF belum siap'}
          </p>
        </div>

        <PdfSearchBar
            query={query}

            onQueryChange={
              setQuery
            }

            onSearch={() =>
              void runSearch()
            }

            onPrevious={
              previousMatch
            }

            onNext={
              nextMatch
            }

            onClear={
              clearSearch
            }

            isSearching={
              isSearching
            }

            progress={
              searchProgress
            }

            totalMatches={
              matches.length
            }

            activeMatchIndex={
              activeMatchIndex
            }

            disabled={
              !pdfDocument
            }
          />

        <div className="flex flex-wrap items-center justify-end gap-1">
          <button
            className="toolbar-button"
            type="button"
            disabled={
              !pdfDocument ||
              pageNumber <= 1
            }
            onClick={() =>
              changePage(
                pageNumber - 1,
              )
            }
            title="Halaman sebelumnya"
          >
            <ChevronLeft
              size={17}
            />
          </button>

          <div className="flex items-center gap-1 text-xs text-slate-400">
            <input
              value={
                pageInput
              }
              disabled={
                !pdfDocument
              }
              inputMode="numeric"
              onChange={(
                event,
              ) =>
                setPageInput(
                  event.target
                    .value,
                )
              }
              onBlur={
                commitPageInput
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  commitPageInput()

                  event.currentTarget.blur()
                }
              }}
              className="h-8 w-12 rounded-lg border border-slate-700 bg-slate-900 px-2 text-center text-xs text-slate-200 outline-none focus:border-blue-500"
              aria-label="Nomor halaman"
            />

            <span>
              /
              {' '}
              {
                pdfDocument?.numPages ??
                0
              }
            </span>
          </div>

          <button
            className="toolbar-button"
            type="button"
            disabled={
              !pdfDocument ||
              pageNumber >=
                (
                  pdfDocument?.numPages ??
                  0
                )
            }
            onClick={() =>
              changePage(
                pageNumber + 1,
              )
            }
            title="Halaman berikutnya"
          >
            <ChevronRight
              size={17}
            />
          </button>

          <div className="mx-2 h-5 w-px bg-slate-700" />

          <button
            className="toolbar-button"
            type="button"
            disabled={
              !pdfDocument ||
              scale <=
                MIN_VIEWER_SCALE
            }
            onClick={() =>
              changeScale(
                scale -
                  VIEWER_SCALE_STEP,
              )
            }
            title="Zoom out (Ctrl+-)"
          >
            <ZoomOut size={17} />
          </button>

          <span className="w-16 text-center text-xs text-slate-400">
            {Math.round(
              scale * 100,
            )}
            %
          </span>

          <button
            className="toolbar-button"
            type="button"
            disabled={
              !pdfDocument ||
              scale >=
                MAX_VIEWER_SCALE
            }
            onClick={() =>
              changeScale(
                scale +
                  VIEWER_SCALE_STEP,
              )
            }
            title="Zoom in (Ctrl++)"
          >
            <ZoomIn size={17} />
          </button>

          <button
            type="button"
            disabled={
              !pdfDocument
            }
            onClick={() =>
              void fitTo(
                'width',
              )
            }
            className={clsx(
              'h-8 rounded-lg px-3 text-xs transition',

              fitMode === 'width'
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            Fit Lebar
          </button>

          <button
            type="button"
            disabled={
              !pdfDocument
            }
            onClick={() =>
              void fitTo(
                'page',
              )
            }
            className={clsx(
              'h-8 rounded-lg px-3 text-xs transition',

              fitMode === 'page'
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            Fit Halaman
          </button>

          <button
            className="toolbar-button"
            type="button"
            disabled={
              !pdfDocument
            }
            onClick={
              rotateClockwise
            }
            title="Putar tampilan 90°"
          >
            <RotateCw
              size={17}
            />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {pdfDocument ? (
          <ThumbnailPanel
            pdfDocument={
              pdfDocument
            }
            activePage={
              pageNumber
            }
            rotation={
              rotation
            }
            onSelectPage={
              changePage
            }
          />
        ) : (
          <aside className="w-48 shrink-0 border-r border-slate-800 bg-slate-950/40 p-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center text-xs text-slate-500">
              Thumbnail belum
              tersedia.
            </div>
          </aside>
        )}

        {/* Area utama PDF */}
        <div
          ref={
            viewerContainerRef
          }
          className="min-w-0 flex-1 overflow-auto bg-slate-800/40 p-8"
        >
          <div className="flex min-h-full min-w-max items-start justify-center">
            {isLoading && (
              <div className="mt-20 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-sm text-slate-300">
                <LoaderCircle
                  className="animate-spin"
                  size={20}
                />

                Memuat PDF...
              </div>
            )}

            {!isLoading &&
              errorMessage && (
                <div className="mt-20 max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className="mt-0.5 shrink-0"
                      size={20}
                    />

                    <div>
                      <p className="font-semibold">
                        PDF gagal
                        ditampilkan
                      </p>

                      <p className="mt-2 break-words text-red-200/80">
                        {
                          errorMessage
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {!isLoading &&
              pdfDocument &&
              !errorMessage && (
                <PdfPageCanvas
                  pdfDocument={
                    pdfDocument
                  }

                  pageNumber={
                    pageNumber
                  }

                  scale={
                    scale
                  }

                  rotation={
                    rotation
                  }

                  pageMatches={
                    currentPageMatches
                  }

                  activeMatchId={
                    activeMatch?.id ??
                    null
                  }
                />
              )}
          </div>
        </div>

        {/* Properties */}
        <aside className="w-64 shrink-0 overflow-auto border-l border-slate-800 bg-slate-950/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Properties
          </h3>

          <dl className="mt-4 space-y-4 text-xs">
            <div>
              <dt className="text-slate-600">
                Nama file
              </dt>

              <dd className="mt-1 break-all text-slate-300">
                {
                  activeDocument.fileName
                }
              </dd>
            </div>

            <div>
              <dt className="text-slate-600">
                Ukuran data
              </dt>

              <dd className="mt-1 text-slate-300">
                {
                  activeDocument.data
                    ?.byteLength
                    .toLocaleString(
                      'id-ID',
                    ) ?? 0
                }
                {' '}
                byte
              </dd>
            </div>

            <div>
              <dt className="text-slate-600">
                Jumlah halaman
              </dt>

              <dd className="mt-1 text-slate-300">
                {
                  pdfDocument
                    ?.numPages ??
                  '-'
                }
              </dd>
            </div>

            <div>
              <dt className="text-slate-600">
                Halaman aktif
              </dt>

              <dd className="mt-1 text-slate-300">
                {pageNumber}
              </dd>
            </div>

            <div>
              <dt className="text-slate-600">
                Skala
              </dt>

              <dd className="mt-1 text-slate-300">
                {Math.round(
                  scale * 100,
                )}
                %
              </dd>
            </div>

            <div>
              <dt className="text-slate-600">
                Mode tampilan
              </dt>

              <dd className="mt-1 text-slate-300">
                {fitMode ===
                'custom'
                  ? 'Manual'
                  : fitMode ===
                      'width'
                    ? 'Fit lebar'
                    : 'Fit halaman'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-600">
                Rotasi tampilan
              </dt>

              <dd className="mt-1 text-slate-300">
                {rotation}°
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-[11px] leading-5 text-slate-500">
            Panah kiri/kanan:
            pindah halaman.
            <br />
            Ctrl + / Ctrl -:
            zoom.
            <br />
            Ctrl 0: fit halaman.
          </div>
        </aside>
      </div>
    </section>
  )
}