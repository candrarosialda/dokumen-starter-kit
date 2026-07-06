import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  PDFDocumentProxy,
  RenderTask,
} from 'pdfjs-dist'

import { clsx } from 'clsx'

type PdfThumbnailProps = {
  pdfDocument: PDFDocumentProxy
  pageNumber: number
  active: boolean
  rotation: number
  onSelect: (
    pageNumber: number,
  ) => void
}

const THUMBNAIL_WIDTH = 120

export function PdfThumbnail({
  pdfDocument,
  pageNumber,
  active,
  rotation,
  onSelect,
}: PdfThumbnailProps) {
  const buttonRef =
    useRef<HTMLButtonElement>(null)

  const canvasRef =
    useRef<HTMLCanvasElement>(null)

  const [isVisible, setIsVisible] =
    useState(false)

  const [isRendered, setIsRendered] =
    useState(false)

  const [hasError, setHasError] =
    useState(false)

  /*
   * Thumbnail baru dirender saat mendekati
   * area yang terlihat.
   *
   * Ini mencegah seluruh halaman PDF besar
   * dirender bersamaan.
   */
  useEffect(() => {
    const button = buttonRef.current

    if (!button) {
      return
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visible =
            entries.some(
              (entry) =>
                entry.isIntersecting,
            )

          if (visible) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: '300px 0px',
        },
      )

    observer.observe(button)

    return () => {
      observer.disconnect()
    }
  }, [])

  /*
   * Pastikan thumbnail halaman aktif
   * terlihat pada panel sebelah kiri.
   */
  useEffect(() => {
    if (!active) {
      return
    }

    buttonRef.current?.scrollIntoView({
      block: 'nearest',
    })
  }, [active])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    let disposed = false
    let renderTask: RenderTask | null =
      null

    const renderThumbnail =
      async (): Promise<void> => {
        try {
          setHasError(false)
          setIsRendered(false)

          const page =
            await pdfDocument.getPage(
              pageNumber,
            )

          if (disposed) {
            return
          }

          const effectiveRotation =
            (page.rotate + rotation) %
            360

          const baseViewport =
            page.getViewport({
              scale: 1,
              rotation:
                effectiveRotation,
            })

          const thumbnailScale =
            THUMBNAIL_WIDTH /
            baseViewport.width

          const viewport =
            page.getViewport({
              scale: thumbnailScale,
              rotation:
                effectiveRotation,
            })

          const outputScale =
            window.devicePixelRatio ||
            1

          canvas.width = Math.floor(
            viewport.width *
              outputScale,
          )

          canvas.height = Math.floor(
            viewport.height *
              outputScale,
          )

          canvas.style.width =
            `${Math.floor(
              viewport.width,
            )}px`

          canvas.style.height =
            `${Math.floor(
              viewport.height,
            )}px`

          renderTask = page.render({
            canvas,
            viewport,

            transform:
              outputScale === 1
                ? undefined
                : [
                    outputScale,
                    0,
                    0,
                    outputScale,
                    0,
                    0,
                  ],
          })

          await renderTask.promise

          if (!disposed) {
            setIsRendered(true)
          }
        } catch (error) {
          if (
            disposed ||
            (
              error instanceof Error &&
              error.name ===
                'RenderingCancelledException'
            )
          ) {
            return
          }

          setHasError(true)
        }
      }

    void renderThumbnail()

    return () => {
      disposed = true
      renderTask?.cancel()
    }
  }, [
    isVisible,
    pageNumber,
    pdfDocument,
    rotation,
  ])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() =>
        onSelect(pageNumber)
      }
      className={clsx(
        'group w-full rounded-xl border p-2 transition',

        active
          ? 'border-blue-400 bg-blue-500/15 ring-1 ring-blue-400/30'
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900',
      )}
      aria-label={`Buka halaman ${pageNumber}`}
      aria-current={
        active ? 'page' : undefined
      }
    >
      <div className="relative mx-auto flex min-h-36 items-center justify-center overflow-hidden rounded bg-slate-800/70">
        {!isRendered &&
          !hasError && (
            <div className="absolute inset-0 animate-pulse bg-slate-800" />
          )}

        {hasError ? (
          <span className="px-2 text-center text-[10px] text-red-300">
            Thumbnail gagal dimuat
          </span>
        ) : (
          <canvas
            ref={canvasRef}
            className={clsx(
              'block max-w-full bg-white shadow-md transition-opacity',

              isRendered
                ? 'opacity-100'
                : 'opacity-0',
            )}
          />
        )}
      </div>

      <span
        className={clsx(
          'mt-2 block text-center text-xs',

          active
            ? 'font-semibold text-blue-300'
            : 'text-slate-500',
        )}
      >
        Halaman {pageNumber}
      </span>
    </button>
  )
}