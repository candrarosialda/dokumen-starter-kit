import {
  create,
} from 'zustand'

export type OrganizerPageItem = {
  id: string

  /*
   * Nomor halaman sumber dimulai dari 1.
   */
  pageNumber: number

  /*
   * Rotasi tambahan dari pengguna.
   */
  rotation: number
}

export type OrganizerSession = {
  documentId: string
  sourcePageCount: number

  pages:
    OrganizerPageItem[]

  selectedPageIds:
    string[]

  outputFile: string
}

type OrganizerState = {
  sessions: Record<
    string,
    OrganizerSession
  >

  initializeSession: (
    documentId: string,
    pageCount: number,
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

function createInitialPages(
  documentId: string,
  pageCount: number,
): OrganizerPageItem[] {
  return Array.from(
    {
      length: pageCount,
    },

    (_, index) => ({
      id:
        `${documentId}:` +
        `${index + 1}`,

      pageNumber:
        index + 1,

      rotation: 0,
    }),
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

export const useOrganizerStore =
  create<OrganizerState>(
    (set) => ({
      sessions: {},

      initializeSession: (
        documentId,
        pageCount,
      ) => {
        set((state) => {
          const existing =
            state.sessions[
              documentId
            ]

          if (
            existing &&
            existing.sourcePageCount ===
              pageCount
          ) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                documentId,
                sourcePageCount:
                  pageCount,

                pages:
                  createInitialPages(
                    documentId,
                    pageCount,
                  ),

                selectedPageIds:
                  [],

                outputFile: '',
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
                            id !==
                            pageId,
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

          const selectedSet =
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
                      selectedSet.has(
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

          const selectedSet =
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
                      !selectedSet.has(
                        page.id,
                      ),
                  ),

                selectedPageIds:
                  [],
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
                      page.id !==
                      pageId,
                  ),

                selectedPageIds:
                  session
                    .selectedPageIds
                    .filter(
                      (id) =>
                        id !==
                        pageId,
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
                      page.id ===
                      pageId
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
            session.pages.findIndex(
              (page) =>
                page.id ===
                draggedPageId,
            )

          const targetIndex =
            session.pages.findIndex(
              (page) =>
                page.id ===
                targetPageId,
            )

          if (
            fromIndex === -1 ||
            targetIndex === -1
          ) {
            return state
          }

          const nextPages = [
            ...session.pages,
          ]

          const [
            movedPage,
          ] = nextPages.splice(
            fromIndex,
            1,
          )

          const adjustedIndex =
            fromIndex <
            targetIndex
              ? targetIndex - 1
              : targetIndex

          nextPages.splice(
            adjustedIndex,
            0,
            movedPage,
          )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,
                pages:
                  nextPages,
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
                  createInitialPages(
                    documentId,

                    session
                      .sourcePageCount,
                  ),

                selectedPageIds:
                  [],

                outputFile: '',
              },
            },
          }
        })
      },
    }),
  )