import {
  FileImage,
  FileText,
  GripVertical,
  RotateCcw,
  RotateCw,
  Trash2,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from 'react'

import { clsx } from 'clsx'

import type {
  RenderTask,
} from 'pdfjs-dist'

import type {
  OrganizerPageItem,
} from '../../../store/useOrganizerStore'

import {
  loadOrganizerImage,
  loadOrganizerPdf,
} from '../lib/organizerAssetCache'

type OrganizerPageCardProps = {
  item: OrganizerPageItem
  displayIndex: number
  selected: boolean

  onToggle: () => void
  onRotateLeft: () => void
  onRotateRight: () => void
  onDelete: () => void

  onDropPage: (
    draggedPageId: string,
    targetPageId: string,
  ) => void
}

const THUMBNAIL_WIDTH = 150

export function OrganizerPageCard({
  item,
  displayIndex,
  selected,
  onToggle,
  onRotateLeft,
  onRotateRight,
  onDelete,
  onDropPage,
}: OrganizerPageCardProps) {
  const cardRef =
    useRef<HTMLElement>(null)

  const canvasRef =
    useRef<HTMLCanvasElement>(null)

  const [
    isVisible,
    setIsVisible,
  ] = useState(false)

  const [
    imageUrl,
    setImageUrl,
  ] = useState<string | null>(
    null,
  )

  const [
    isRendered,
    setIsRendered,
  ] = useState(false)

  const [
    hasError,
    setHasError,
  ] = useState(false)

  const [
    isDragOver,
    setIsDragOver,
  ] = useState(false)

  /*
   * Thumbnail hanya dimuat ketika kartu
   * mulai mendekati area yang terlihat.
   */
  useEffect(() => {
    const card =
      cardRef.current

    if (!card) {
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
          rootMargin: '400px',
        },
      )

    observer.observe(card)

    return () => {
      observer.disconnect()
    }
  }, [])

  /*
   * Muat preview gambar JPG atau PNG.
   */
  useEffect(() => {
    if (
      !isVisible ||
      item.kind !== 'image'
    ) {
      setImageUrl(null)
      return
    }

    let disposed = false

    setHasError(false)

    void loadOrganizerImage(
      item.sourceFile,
    )
      .then((url) => {
        if (!disposed) {
          setImageUrl(url)
        }
      })
      .catch(() => {
        if (!disposed) {
          setHasError(true)
        }
      })

    return () => {
      disposed = true
    }
  }, [
    isVisible,
    item,
  ])

  /*
   * Render halaman PDF ke canvas.
   *
   * pageNumber hanya boleh digunakan
   * ketika jenis halaman adalah PDF.
   */
  useEffect(() => {
    if (
      !isVisible ||
      item.kind !== 'pdf'
    ) {
      return
    }

    const canvas =
      canvasRef.current

    if (!canvas) {
      return
    }

    let disposed = false

    let renderTask:
      RenderTask | null = null

    setIsRendered(false)
    setHasError(false)

    const renderPdf =
      async (): Promise<void> => {
        try {
          const pdfDocument =
            await loadOrganizerPdf(
              item.sourceFile,
            )

          if (disposed) {
            return
          }

          const page =
            await pdfDocument.getPage(
              item.pageNumber,
            )

          if (disposed) {
            return
          }

          const effectiveRotation =
            (
              page.rotate +
              item.rotation
            ) % 360

          const baseViewport =
            page.getViewport({
              scale: 1,
              rotation:
                effectiveRotation,
            })

          const scale =
            THUMBNAIL_WIDTH /
            baseViewport.width

          const viewport =
            page.getViewport({
              scale,
              rotation:
                effectiveRotation,
            })

          const outputScale =
            window.devicePixelRatio ||
            1

          canvas.width =
            Math.floor(
              viewport.width *
                outputScale,
            )

          canvas.height =
            Math.floor(
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

          renderTask =
            page.render({
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

    void renderPdf()

    return () => {
      disposed = true
      renderTask?.cancel()
    }
  }, [
    isVisible,
    item,
  ])

  function stopAndRun(
    event:
      MouseEvent<HTMLButtonElement>,
    callback: () => void,
  ): void {
    event.stopPropagation()
    callback()
  }

  function handleDragStart(
    event:
      DragEvent<HTMLElement>,
  ): void {
    event.dataTransfer.effectAllowed =
      'move'

    event.dataTransfer.setData(
      'application/x-document-page',
      item.id,
    )
  }

  function handleDrop(
    event:
      DragEvent<HTMLElement>,
  ): void {
    event.preventDefault()

    setIsDragOver(false)

    const draggedPageId =
      event.dataTransfer.getData(
        'application/x-document-page',
      )

    if (!draggedPageId) {
      return
    }

    onDropPage(
      draggedPageId,
      item.id,
    )
  }

  const sourceLabel =
    item.kind === 'pdf'
      ? (
          `${item.sourceFileName} • ` +
          `Halaman ${item.pageNumber}`
        )
      : item.kind === 'image'
        ? item.sourceFileName
        : 'Halaman kosong A4'

  return (
    <article
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={(event) => {
        event.preventDefault()

        event.dataTransfer.dropEffect =
          'move'

        setIsDragOver(true)
      }}
      onDragLeave={() =>
        setIsDragOver(false)
      }
      onDrop={handleDrop}
      onClick={onToggle}
      className={clsx(
        'group relative cursor-pointer rounded-2xl border p-3 transition',

        selected
          ? 'border-blue-400 bg-blue-500/15 ring-1 ring-blue-400/30'
          : 'border-slate-800 bg-slate-950/65 hover:border-slate-600',

        isDragOver &&
          'border-emerald-400 bg-emerald-500/10',
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <GripVertical
            size={15}
            className="shrink-0 cursor-grab text-slate-600"
          />

          <input
            type="checkbox"
            checked={selected}
            readOnly
            onClick={(event) => {
              event.stopPropagation()
              onToggle()
            }}
            className="h-4 w-4 accent-blue-500"
          />

          <span className="truncate text-xs font-semibold text-slate-300">
            Posisi {displayIndex}
          </span>
        </div>

        {item.kind === 'image' ? (
          <FileImage
            size={14}
            className="text-violet-400"
          />
        ) : (
          <FileText
            size={14}
            className={
              item.kind === 'blank'
                ? 'text-slate-500'
                : 'text-blue-400'
            }
          />
        )}
      </div>

      <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-xl bg-slate-800/70 p-2">
        {hasError && (
          <p className="px-3 text-center text-xs text-red-300">
            Preview gagal dimuat.
          </p>
        )}

        {!hasError &&
          item.kind === 'blank' && (
            <div
              className="flex h-52 items-center justify-center bg-white text-xs text-slate-400 shadow-xl"
              style={{
                aspectRatio:
                  `${item.width} / ${item.height}`,

                transform:
                  `rotate(${item.rotation}deg)`,
              }}
            >
              Halaman kosong
            </div>
          )}

        {!hasError &&
          item.kind === 'image' &&
          imageUrl && (
            <img
              src={imageUrl}
              alt={item.sourceFileName}
              className="max-h-52 max-w-full bg-white object-contain shadow-xl"
              style={{
                transform:
                  `rotate(${item.rotation}deg)`,
              }}
            />
          )}

        {!hasError &&
          item.kind === 'pdf' && (
            <>
              {!isRendered && (
                <div className="absolute inset-0 animate-pulse bg-slate-800" />
              )}

              <canvas
                ref={canvasRef}
                className={clsx(
                  'block max-h-56 max-w-full bg-white shadow-xl transition-opacity',

                  isRendered
                    ? 'opacity-100'
                    : 'opacity-0',
                )}
              />
            </>
          )}
      </div>

      <p
        className="mt-3 truncate text-[10px] text-slate-600"
        title={sourceLabel}
      >
        {sourceLabel}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Rotasi {item.rotation}°
        </span>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={(event) =>
              stopAndRun(
                event,
                onRotateLeft,
              )
            }
            className="toolbar-button !h-8 !w-8"
            title="Putar ke kiri"
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={(event) =>
              stopAndRun(
                event,
                onRotateRight,
              )
            }
            className="toolbar-button !h-8 !w-8"
            title="Putar ke kanan"
          >
            <RotateCw size={15} />
          </button>

          <button
            type="button"
            onClick={(event) =>
              stopAndRun(
                event,
                onDelete,
              )
            }
            className="toolbar-button !h-8 !w-8 text-red-300 hover:bg-red-500/10"
            title="Hapus halaman"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}