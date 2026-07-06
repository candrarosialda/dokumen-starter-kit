import {
  FileText,
  Plus,
  X,
} from 'lucide-react'

import {
  useEffect,
  useRef,
} from 'react'

import {
  openPdfFromDialog,
} from '../../lib/openPdf'

import {
  useAppStore,
} from '../../store/useAppStore'

import type {
  KeyboardEvent,
  MouseEvent,
} from 'react'

export function DocumentTabs() {
  const containerRef =
    useRef<HTMLDivElement>(null)

  const documents =
    useAppStore(
      (state) =>
        state.documents,
    )

  const activeDocumentId =
    useAppStore(
      (state) =>
        state.activeDocumentId,
    )

  const activateDocument =
    useAppStore(
      (state) =>
        state.activateDocument,
    )

  const closeDocument =
    useAppStore(
      (state) =>
        state.closeDocument,
    )

  const closeAllDocuments =
    useAppStore(
      (state) =>
        state.closeAllDocuments,
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

  /*
   * Saat tab aktif berubah, pastikan tab
   * tersebut terlihat pada horizontal scroll.
   */
  useEffect(() => {
    if (
      !activeDocumentId ||
      !containerRef.current
    ) {
      return
    }

    const activeTab =
      containerRef.current
        .querySelector<HTMLElement>(
          `[data-document-tab="${activeDocumentId}"]`,
        )

    activeTab?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [activeDocumentId])

  if (documents.length === 0) {
    return null
  }

  function activateTab(
    documentId: string,
    fileName: string,
  ): void {
    activateDocument(
      documentId,
    )

    setWorkspace('viewer')

    setStatusMessage(
      `${fileName} aktif`,
    )
  }

  function closeTab(
    event:
        | MouseEvent
        | KeyboardEvent,

    documentId: string,
  ): void {
    event.stopPropagation()

    closeDocument(
      documentId,
    )
  }

  return (
    <div className="flex h-11 shrink-0 border-b border-slate-800 bg-slate-950/80">
      <div
        ref={containerRef}
        className="flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
      >
        {documents.map(
          (document) => {
            const isActive =
              document.id ===
              activeDocumentId

            return (
              <button
                key={document.id}
                type="button"
                data-document-tab={
                  document.id
                }
                onClick={() =>
                  activateTab(
                    document.id,
                    document.fileName,
                  )
                }
                onAuxClick={(
                  event,
                ) => {
                  /*
                   * Klik tengah mouse menutup tab.
                   */
                  if (
                    event.button === 1
                  ) {
                    closeTab(
                      event,
                      document.id,
                    )
                  }
                }}
                title={
                  document.filePath
                }
                className={[
                  'group relative flex h-11 min-w-44 max-w-64 shrink-0 items-center gap-2 border-r border-slate-800 px-3 text-left text-xs transition',

                  isActive
                    ? 'bg-slate-900 text-slate-100'
                    : 'bg-slate-950/40 text-slate-500 hover:bg-slate-900/70 hover:text-slate-300',
                ].join(' ')}
              >
                {isActive && (
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />
                )}

                <FileText
                  size={15}
                  className={
                    isActive
                      ? 'shrink-0 text-blue-400'
                      : 'shrink-0 text-slate-600'
                  }
                />

                <span className="min-w-0 flex-1 truncate">
                  {
                    document.fileName
                  }
                </span>

                {document.isDirty && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-amber-400"
                    title="Belum disimpan"
                  />
                )}

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(
                    event,
                  ) =>
                    closeTab(
                      event,
                      document.id,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                        'Enter' ||
                      event.key === ' '
                    ) {
                      closeTab(
                        event,
                        document.id,
                      )
                    }
                  }}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-600 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  aria-label={
                    `Tutup ${document.fileName}`
                  }
                >
                  <X size={14} />
                </span>
              </button>
            )
          },
        )}
      </div>

      <div className="flex shrink-0 items-center border-l border-slate-800 bg-slate-950">
        <button
          type="button"
          onClick={() =>
            void openPdfFromDialog()
          }
          className="grid h-11 w-11 place-items-center text-slate-500 transition hover:bg-slate-900 hover:text-white"
          title="Buka PDF baru"
          aria-label="Buka PDF baru"
        >
          <Plus size={17} />
        </button>

        <button
          type="button"
          onClick={() => {
            closeAllDocuments()

            setStatusMessage(
              'Semua dokumen ditutup.',
            )
          }}
          className="grid h-11 w-11 place-items-center text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
          title="Tutup semua tab"
          aria-label="Tutup semua tab"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  )
}