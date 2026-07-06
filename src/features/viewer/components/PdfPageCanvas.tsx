import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import {
  TextLayer,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist'

import type {
  PdfSearchMatch,
} from '../types'

type PdfPageCanvasProps = {
  pdfDocument: PDFDocumentProxy
  pageNumber: number
  scale: number
  rotation: number

  pageMatches:
    PdfSearchMatch[]

  activeMatchId:
    string | null
}

type PageSize = {
  width: number
  height: number
  totalScaleFactor: number
}

export function PdfPageCanvas({
  pdfDocument,
  pageNumber,
  scale,
  rotation,
  pageMatches,
  activeMatchId,
}: PdfPageCanvasProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(
      null,
    )

  const textLayerContainerRef =
    useRef<HTMLDivElement>(
      null,
    )

  /*
   * Text div hasil TextLayer disimpan
   * agar bisa diberi class highlight.
   */
  const textDivsRef =
    useRef<HTMLElement[]>([])

  const [
    textLayerVersion,
    setTextLayerVersion,
  ] = useState(0)

  const [
    pageSize,
    setPageSize,
  ] = useState<PageSize>({
    width: 0,
    height: 0,
    totalScaleFactor: scale,
  })

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * Render canvas dan text layer.
   */
  useEffect(() => {
    const canvas =
      canvasRef.current

    const textLayerContainer =
      textLayerContainerRef.current

    if (
      !canvas ||
      !textLayerContainer
    ) {
      return
    }

    let renderTask:
      RenderTask | null = null

    let textLayer:
      TextLayer | null = null

    let disposed = false

    const renderPage =
      async (): Promise<void> => {
        try {
          setErrorMessage(null)

          textDivsRef.current = []

          textLayerContainer
            .replaceChildren()

          const page =
            await pdfDocument.getPage(
              pageNumber,
            )

          if (disposed) {
            return
          }

          const effectiveRotation =
            (
              page.rotate +
              rotation
            ) % 360

          const viewport =
            page.getViewport({
              scale,
              rotation:
                effectiveRotation,
            })

          const outputScale =
            window.devicePixelRatio ||
            1

          setPageSize({
            width: viewport.width,
            height: viewport.height,

            totalScaleFactor:
              viewport.scale,
          })

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

          /*
           * TextLayer membutuhkan
           * CSS custom properties ini.
           */
          textLayerContainer
            .style
            .setProperty(
              '--total-scale-factor',
              String(
                viewport.scale,
              ),
            )

          textLayerContainer
            .style
            .setProperty(
              '--scale-round-x',
              '1px',
            )

          textLayerContainer
            .style
            .setProperty(
              '--scale-round-y',
              '1px',
            )

          const textContentPromise =
            page.getTextContent()

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

          const textContent =
            await textContentPromise

          if (disposed) {
            return
          }

          textLayer =
            new TextLayer({
              textContentSource:
                textContent,

              container:
                textLayerContainer,

              viewport,
            })

          await Promise.all([
            renderTask.promise,
            textLayer.render(),
          ])

          if (disposed) {
            return
          }

          textDivsRef.current =
            textLayer.textDivs

          /*
           * Memicu effect highlight
           * setelah text layer siap.
           */
          setTextLayerVersion(
            (current) =>
              current + 1,
          )
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

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Halaman PDF gagal dirender.',
          )
        }
      }

    void renderPage()

    return () => {
      disposed = true

      renderTask?.cancel()
      textLayer?.cancel()

      textDivsRef.current = []

      textLayerContainer
        .replaceChildren()
    }
  }, [
    pageNumber,
    pdfDocument,
    rotation,
    scale,
  ])

  /*
   * Memberikan highlight pada item teks
   * yang cocok dengan hasil pencarian.
   */
  useEffect(() => {
    const textDivs =
      textDivsRef.current

    textDivs.forEach(
      (textDiv) => {
        textDiv.classList.remove(
          'pdf-search-hit',
          'pdf-search-hit-active',
        )
      },
    )

    pageMatches.forEach(
      (match) => {
        const textDiv =
          textDivs[
            match.itemIndex
          ]

        if (!textDiv) {
          return
        }

        textDiv.classList.add(
          'pdf-search-hit',
        )

        if (
          match.id ===
          activeMatchId
        ) {
          textDiv.classList.add(
            'pdf-search-hit-active',
          )
        }
      },
    )
  }, [
    activeMatchId,
    pageMatches,
    textLayerVersion,
  ])

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
        Gagal merender halaman:
        {' '}
        {errorMessage}
      </div>
    )
  }

  const layerStyle = {
    width:
      `${pageSize.width}px`,

    height:
      `${pageSize.height}px`,

    '--total-scale-factor':
      String(
        pageSize
          .totalScaleFactor,
      ),

    '--scale-round-x':
      '1px',

    '--scale-round-y':
      '1px',
  } as CSSProperties

  return (
    <div
      className="pdf-page-layer"
      style={layerStyle}
    >
      <canvas
        ref={canvasRef}
        className="block bg-white shadow-2xl shadow-black/50"
        aria-label={
          `Halaman PDF ${pageNumber}`
        }
      />

      <div
        ref={
          textLayerContainerRef
        }
        className="pdf-text-layer"
        aria-label={
          `Lapisan teks halaman ${pageNumber}`
        }
      />
    </div>
  )
}