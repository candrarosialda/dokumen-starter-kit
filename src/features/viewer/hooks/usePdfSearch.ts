import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'

import type {
  PdfSearchMatch,
} from '../types'

function normalizeSearchText(
  value: string,
): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('id-ID')
}

export function usePdfSearch(
  pdfDocument: PDFDocumentProxy | null,
) {
  const [query, setQuery] =
    useState('')

  /*
   * searchedQuery berbeda dari query.
   *
   * query adalah isi input saat ini.
   * searchedQuery adalah teks yang
   * terakhir benar-benar dicari.
   */
  const [
    searchedQuery,
    setSearchedQuery,
  ] = useState('')

  const [
    matches,
    setMatches,
  ] = useState<PdfSearchMatch[]>([])

  const [
    activeMatchIndex,
    setActiveMatchIndex,
  ] = useState(-1)

  const [
    isSearching,
    setIsSearching,
  ] = useState(false)

  const [
    searchProgress,
    setSearchProgress,
  ] = useState(0)

  const [
    searchError,
    setSearchError,
  ] = useState<string | null>(null)

  /*
   * Token digunakan untuk membatalkan
   * pencarian lama saat:
   *
   * - dokumen diganti;
   * - pencarian dibersihkan;
   * - pencarian baru dijalankan.
   */
  const searchTokenRef = useRef(0)

  const clearSearch =
    useCallback((): void => {
      searchTokenRef.current += 1

      setQuery('')
      setSearchedQuery('')
      setMatches([])
      setActiveMatchIndex(-1)
      setIsSearching(false)
      setSearchProgress(0)
      setSearchError(null)
    }, [])

  /*
   * Bersihkan pencarian saat dokumen
   * PDF berubah.
   */
  useEffect(() => {
    clearSearch()
  }, [
    clearSearch,
    pdfDocument,
  ])

  const runSearch =
    useCallback(
      async (): Promise<void> => {
        const cleanQuery =
          query.trim()

        if (
          !pdfDocument ||
          !cleanQuery
        ) {
          setSearchedQuery('')
          setMatches([])
          setActiveMatchIndex(-1)
          setSearchProgress(0)
          setSearchError(null)

          return
        }

        const token =
          searchTokenRef.current + 1

        searchTokenRef.current =
          token

        const normalizedQuery =
          normalizeSearchText(
            cleanQuery,
          )

        const foundMatches:
          PdfSearchMatch[] = []

        setIsSearching(true)
        setSearchError(null)
        setSearchProgress(0)
        setSearchedQuery(
          cleanQuery,
        )
        setMatches([])
        setActiveMatchIndex(-1)

        try {
          /*
           * Baca teks halaman satu per satu
           * agar tidak merender seluruh
           * dokumen sekaligus.
           */
          for (
            let pageNumber = 1;
            pageNumber <=
            pdfDocument.numPages;
            pageNumber += 1
          ) {
            if (
              searchTokenRef.current !==
              token
            ) {
              return
            }

            const page =
              await pdfDocument.getPage(
                pageNumber,
              )

            const textContent =
              await page.getTextContent()

            textContent.items.forEach(
              (
                item,
                itemIndex,
              ) => {
                /*
                 * TextMarkedContent tidak
                 * mempunyai properti str.
                 */
                if (
                  !('str' in item) ||
                  !item.str
                ) {
                  return
                }

                const normalizedItem =
                  normalizeSearchText(
                    item.str,
                  )

                let fromIndex = 0
                let occurrenceIndex = 0

                while (
                  fromIndex <
                  normalizedItem.length
                ) {
                  const foundIndex =
                    normalizedItem.indexOf(
                      normalizedQuery,
                      fromIndex,
                    )

                  if (
                    foundIndex === -1
                  ) {
                    break
                  }

                  foundMatches.push({
                    id:
                      `${pageNumber}-` +
                      `${itemIndex}-` +
                      `${occurrenceIndex}`,

                    pageNumber,
                    itemIndex,
                    occurrenceIndex,
                    text: item.str,
                  })

                  occurrenceIndex += 1

                  fromIndex =
                    foundIndex +
                    Math.max(
                      normalizedQuery
                        .length,
                      1,
                    )
                }
              },
            )

            if (
              searchTokenRef.current !==
              token
            ) {
              return
            }

            setSearchProgress(
              Math.round(
                (
                  pageNumber /
                  pdfDocument.numPages
                ) * 100,
              ),
            )
          }

          if (
            searchTokenRef.current !==
            token
          ) {
            return
          }

          setMatches(
            foundMatches,
          )

          setActiveMatchIndex(
            foundMatches.length > 0
              ? 0
              : -1,
          )
        } catch (error) {
          if (
            searchTokenRef.current !==
            token
          ) {
            return
          }

          setSearchError(
            error instanceof Error
              ? error.message
              : 'Pencarian PDF gagal.',
          )

          setMatches([])
          setActiveMatchIndex(-1)
        } finally {
          if (
            searchTokenRef.current ===
            token
          ) {
            setIsSearching(false)
          }
        }
      },
      [
        pdfDocument,
        query,
      ],
    )

  const activeMatch =
    useMemo(
      () =>
        activeMatchIndex >= 0
          ? matches[
              activeMatchIndex
            ] ?? null
          : null,
      [
        activeMatchIndex,
        matches,
      ],
    )

  const nextMatch =
    useCallback((): void => {
      if (
        matches.length === 0
      ) {
        return
      }

      setActiveMatchIndex(
        (current) =>
          (
            current + 1
          ) % matches.length,
      )
    }, [
      matches.length,
    ])

  const previousMatch =
    useCallback((): void => {
      if (
        matches.length === 0
      ) {
        return
      }

      setActiveMatchIndex(
        (current) =>
          current <= 0
            ? matches.length - 1
            : current - 1,
      )
    }, [
      matches.length,
    ])

  return {
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
  }
}