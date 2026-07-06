import {
  getDocument,
  type PDFDocumentProxy,
} from 'pdfjs-dist'

import {
  normalizeDocumentPath,
} from '../../../store/useAppStore'

import '../../viewer/lib/pdfWorker'

/*
 * Cache PDF dan gambar mencegah file yang sama
 * dibaca berulang kali ketika thumbnail dirender.
 */
const pdfCache = new Map<
  string,
  Promise<PDFDocumentProxy>
>()

const imageCache = new Map<
  string,
  Promise<string>
>()

export function loadOrganizerPdf(
  filePath: string,
): Promise<PDFDocumentProxy> {
  const cacheKey =
    normalizeDocumentPath(filePath)

  const cachedDocument =
    pdfCache.get(cacheKey)

  if (cachedDocument) {
    return cachedDocument
  }

  const loadingPromise =
    window.desktopAPI.file
      .readPdf(filePath)
      .then((data) => {
        /*
         * Buat salinan data karena PDF.js dapat
         * memindahkan ArrayBuffer ke worker.
         */
        const safeData =
          new Uint8Array(data)

        return getDocument({
          data: safeData,
        }).promise
      })
      .catch((error: unknown) => {
        /*
         * Hapus cache apabila proses gagal,
         * agar file masih bisa dicoba kembali.
         */
        pdfCache.delete(cacheKey)

        throw error
      })

  pdfCache.set(
    cacheKey,
    loadingPromise,
  )

  return loadingPromise
}

export function loadOrganizerImage(
  filePath: string,
): Promise<string> {
  const cacheKey =
    normalizeDocumentPath(filePath)

  const cachedImage =
    imageCache.get(cacheKey)

  if (cachedImage) {
    return cachedImage
  }

  const loadingPromise =
    window.desktopAPI.file
      .readImageDataUrl(filePath)
      .catch((error: unknown) => {
        imageCache.delete(cacheKey)

        throw error
      })

  imageCache.set(
    cacheKey,
    loadingPromise,
  )

  return loadingPromise
}

export async function getImageNaturalSize(
  dataUrl: string,
): Promise<{
  width: number
  height: number
}> {
  return new Promise(
    (resolve, reject) => {
      const image = new Image()

      image.onload = () => {
        if (
          image.naturalWidth <= 0 ||
          image.naturalHeight <= 0
        ) {
          reject(
            new Error(
              'Ukuran gambar tidak valid.',
            ),
          )

          return
        }

        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
      }

      image.onerror = () => {
        reject(
          new Error(
            'Gambar gagal dibaca.',
          ),
        )
      }

      image.src = dataUrl
    },
  )
}