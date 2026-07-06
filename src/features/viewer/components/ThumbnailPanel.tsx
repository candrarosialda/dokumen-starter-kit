import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'

import {
  PdfThumbnail,
} from './PdfThumbnail'

type ThumbnailPanelProps = {
  pdfDocument: PDFDocumentProxy
  activePage: number
  rotation: number

  onSelectPage: (
    pageNumber: number,
  ) => void
}

export function ThumbnailPanel({
  pdfDocument,
  activePage,
  rotation,
  onSelectPage,
}: ThumbnailPanelProps) {
  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-slate-800 bg-slate-950/40">
      <div className="shrink-0 border-b border-slate-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Halaman
        </p>

        <p className="mt-1 text-[11px] text-slate-600">
          {pdfDocument.numPages}
          {' '}
          halaman
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {Array.from(
          {
            length:
              pdfDocument.numPages,
          },

          (_, index) => {
            const pageNumber =
              index + 1

            return (
              <PdfThumbnail
                key={pageNumber}
                pdfDocument={
                  pdfDocument
                }
                pageNumber={
                  pageNumber
                }
                active={
                  activePage ===
                  pageNumber
                }
                rotation={
                  rotation
                }
                onSelect={
                  onSelectPage
                }
              />
            )
          },
        )}
      </div>
    </aside>
  )
}