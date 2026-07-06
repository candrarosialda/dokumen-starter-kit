import {
  create,
} from 'zustand'

type OrganizerPageBase = {
  id: string
  rotation: number
}

/*
 * Halaman yang bersumber dari dokumen PDF.
 */
export type OrganizerPdfPage =
  OrganizerPageBase & {
    kind: 'pdf'

    sourceFile: string
    sourceFileName: string

    /*
     * Nomor halaman dimulai dari 1.
     */
    pageNumber: number
  }

/*
 * Halaman kosong buatan pengguna.
 */
export type OrganizerBlankPage =
  OrganizerPageBase & {
    kind: 'blank'

    /*
     * Ukuran menggunakan PDF point.
     * A4 kira-kira 595 × 842.
     */
    width: number
    height: number
  }

/*
 * Halaman yang bersumber dari JPG/PNG.
 */
export type OrganizerImagePage =
  OrganizerPageBase & {
    kind: 'image'

    sourceFile: string
    sourceFileName: string

    /*
     * Ukuran halaman PDF tujuan,
     * bukan ukuran piksel gambar.
     */
    width: number
    height: number
  }

export type OrganizerPageItem =
  | OrganizerPdfPage
  | OrganizerBlankPage
  | OrganizerImagePage

export type OrganizerSession = {
  documentId: string

  sourceFile: string
  sourceFileName: string
  sourcePageCount: number

  pages: OrganizerPageItem[]

  selectedPageIds: string[]

  outputFile: string
}

type ImagePageInput = {
  sourceFile: string
  sourceFileName: string

  width: number
  height: number
}

type OrganizerState = {
  sessions: Record<
    string,
    OrganizerSession
  >

  initializeSession: (
    documentId: string,
    sourceFile: string,
    sourceFileName: string,
    pageCount: number,
  ) => void

  appendBlankPage: (
    documentId: string,
  ) => void

  appendPdfPages: (
    documentId: string,
    sourceFile: string,
    sourceFileName: string,
    pageCount: number,
  ) => void

  appendImagePages: (
    documentId: string,
    images: ImagePageInput[],
  ) => void

  setOutputFile: (
    documentId: string,
    outputFile: string,
  ) => void

  togglePageSelection: (
    documentId: string,
    pageId: string,
  ) => void

  selectAllPages: (
    documentId: string,
  ) => void

  clearSelection: (
    documentId: string,
  ) => void

  rotateSelectedPages: (
    documentId: string,
    rotationDelta: -90 | 90,
  ) => void

  deleteSelectedPages: (
    documentId: string,
  ) => void

  deletePage: (
    documentId: string,
    pageId: string,
  ) => void

  rotatePage: (
    documentId: string,
    pageId: string,
    rotationDelta: -90 | 90,
  ) => void

  movePage: (
    documentId: string,
    draggedPageId: string,
    targetPageId: string,
  ) => void

  restoreSession: (
    documentId: string,
  ) => void
}

function createId(
  prefix: string,
): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return (
      `${prefix}:` +
      crypto.randomUUID()
    )
  }

  return (
    `${prefix}:` +
    `${Date.now()}:` +
    Math.random()
      .toString(36)
      .slice(2)
  )
}

function normalizeRotation(
  rotation: number,
): number {
  return (
    (
      rotation % 360
    ) + 360
  ) % 360
}

function createOriginalPages(
  documentId: string,
  sourceFile: string,
  sourceFileName: string,
  pageCount: number,
): OrganizerPdfPage[] {
  return Array.from(
    { length: pageCount },
    (_, index): OrganizerPdfPage => ({
      id:
        `${documentId}:original:` +
        `${index + 1}`,

      kind: 'pdf',

      sourceFile,
      sourceFileName,

      pageNumber: index + 1,
      rotation: 0,
    }),
  )
}

export const useOrganizerStore =
  create<OrganizerState>(
    (set) => ({
      sessions: {},

      initializeSession: (
        documentId,
        sourceFile,
        sourceFileName,
        pageCount,
      ) => {
        set((state) => {
          const existingSession =
            state.sessions[
              documentId
            ]

          /*
           * Jangan reset perubahan organizer
           * apabila session yang sama sudah ada.
           */
          if (
            existingSession &&
            existingSession
              .sourcePageCount ===
              pageCount &&
            existingSession
              .sourceFile ===
              sourceFile
          ) {
            return state
          }

          const newSession:
            OrganizerSession = {
              documentId,

              sourceFile,
              sourceFileName,

              sourcePageCount:
                pageCount,

              pages:
                createOriginalPages(
                  documentId,
                  sourceFile,
                  sourceFileName,
                  pageCount,
                ),

              selectedPageIds: [],

              outputFile: '',
            }

          return {
            sessions: {
              ...state.sessions,

              [documentId]:
                newSession,
            },
          }
        })
      },

      appendBlankPage: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const blankPage:
            OrganizerBlankPage = {
              id: createId(
                'blank',
              ),

              kind: 'blank',

              /*
               * Ukuran A4 portrait.
               */
              width: 595,
              height: 842,

              rotation: 0,
            }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages: [
                  ...session.pages,
                  blankPage,
                ],
              },
            },
          }
        })
      },

      appendPdfPages: (
        documentId,
        sourceFile,
        sourceFileName,
        pageCount,
      ) => {
        if (pageCount < 1) {
          return
        }

        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const newPages =
              Array.from(
                { length: pageCount },
                (_, index): OrganizerPdfPage => ({
                  id: createId(
                    'imported-pdf',
                  ),

                  kind: 'pdf',

                  sourceFile,
                  sourceFileName,

                  pageNumber: index + 1,
                  rotation: 0,
                }),
              )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages: [
                  ...session.pages,
                  ...newPages,
                ],
              },
            },
          }
        })
      },

      appendImagePages: (
        documentId,
        images,
      ) => {
        if (images.length === 0) {
          return
        }

        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const newPages =
            images.map(
              (
                image,
              ): OrganizerImagePage => ({
                id: createId(
                  'image',
                ),

                kind: 'image',

                sourceFile:
                  image.sourceFile,

                sourceFileName:
                  image.sourceFileName,

                width:
                  image.width,

                height:
                  image.height,

                rotation: 0,
              }),
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages: [
                  ...session.pages,
                  ...newPages,
                ],
              },
            },
          }
        })
      },

      setOutputFile: (
        documentId,
        outputFile,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,
                outputFile,
              },
            },
          }
        })
      },

      togglePageSelection: (
        documentId,
        pageId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const isSelected =
            session
              .selectedPageIds
              .includes(pageId)

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                selectedPageIds:
                  isSelected
                    ? session
                        .selectedPageIds
                        .filter(
                          (id) =>
                            id !== pageId,
                        )
                    : [
                        ...session
                          .selectedPageIds,

                        pageId,
                      ],
              },
            },
          }
        })
      },

      selectAllPages: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                selectedPageIds:
                  session.pages.map(
                    (page) =>
                      page.id,
                  ),
              },
            },
          }
        })
      },

      clearSelection: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                selectedPageIds:
                  [],
              },
            },
          }
        })
      },

      rotateSelectedPages: (
        documentId,
        rotationDelta,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (
            !session ||
            session
              .selectedPageIds
              .length === 0
          ) {
            return state
          }

          const selectedIds =
            new Set(
              session
                .selectedPageIds,
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages:
                  session.pages.map(
                    (page) =>
                      selectedIds.has(
                        page.id,
                      )
                        ? {
                            ...page,

                            rotation:
                              normalizeRotation(
                                page.rotation +
                                  rotationDelta,
                              ),
                          }
                        : page,
                  ),
              },
            },
          }
        })
      },

      deleteSelectedPages: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (
            !session ||
            session
              .selectedPageIds
              .length === 0
          ) {
            return state
          }

          const selectedIds =
            new Set(
              session
                .selectedPageIds,
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages:
                  session.pages.filter(
                    (page) =>
                      !selectedIds.has(
                        page.id,
                      ),
                  ),

                selectedPageIds: [],
              },
            },
          }
        })
      },

      deletePage: (
        documentId,
        pageId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages:
                  session.pages.filter(
                    (page) =>
                      page.id !== pageId,
                  ),

                selectedPageIds:
                  session
                    .selectedPageIds
                    .filter(
                      (id) =>
                        id !== pageId,
                    ),
              },
            },
          }
        })
      },

      rotatePage: (
        documentId,
        pageId,
        rotationDelta,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages:
                  session.pages.map(
                    (page) =>
                      page.id === pageId
                        ? {
                            ...page,

                            rotation:
                              normalizeRotation(
                                page.rotation +
                                  rotationDelta,
                              ),
                          }
                        : page,
                  ),
              },
            },
          }
        })
      },

      movePage: (
        documentId,
        draggedPageId,
        targetPageId,
      ) => {
        if (
          draggedPageId ===
          targetPageId
        ) {
          return
        }

        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const fromIndex =
            session.pages
              .findIndex(
                (page) =>
                  page.id ===
                  draggedPageId,
              )

          const targetIndex =
            session.pages
              .findIndex(
                (page) =>
                  page.id ===
                  targetPageId,
              )

          if (
            fromIndex < 0 ||
            targetIndex < 0
          ) {
            return state
          }

          const nextPages = [
            ...session.pages,
          ]

          const [movedPage] =
            nextPages.splice(
              fromIndex,
              1,
            )

          /*
           * Setelah elemen asal dihapus,
           * indeks target dapat bergeser satu posisi.
           */
          const insertIndex =
            fromIndex < targetIndex
              ? targetIndex - 1
              : targetIndex

          nextPages.splice(
            insertIndex,
            0,
            movedPage,
          )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,
                pages: nextPages,
              },
            },
          }
        })
      },

      restoreSession: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                pages:
                  createOriginalPages(
                    documentId,
                    session.sourceFile,
                    session.sourceFileName,
                    session.sourcePageCount,
                  ),

                selectedPageIds: [],

                outputFile: '',
              },
            },
          }
        })
      },
    }),
  )