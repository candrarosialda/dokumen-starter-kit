import {
  create,
} from 'zustand'

import type {
  EditorObject,
  EditorTool,
  PdfRect,
} from '../features/editor/types'

type EditorDocumentSession = {
  documentId: string

  activeTool: EditorTool
  selectedObjectId: string | null

  objects: EditorObject[]

  /*
   * Snapshot untuk undo dan redo.
   */
  history: EditorObject[][]
  historyIndex: number

  isDirty: boolean
}

type EditorState = {
  sessions: Record<
    string,
    EditorDocumentSession
  >

  initializeSession: (
    documentId: string,
  ) => void

  setActiveTool: (
    documentId: string,
    tool: EditorTool,
  ) => void

  selectObject: (
    documentId: string,
    objectId: string | null,
  ) => void

  addObject: (
    documentId: string,
    object: EditorObject,
  ) => void

  updateObject: (
    documentId: string,
    objectId: string,
    changes: Partial<EditorObject>,
  ) => void

  updateObjectRect: (
    documentId: string,
    objectId: string,
    rect: PdfRect,
  ) => void

  deleteObject: (
    documentId: string,
    objectId: string,
  ) => void

  duplicateObject: (
    documentId: string,
    objectId: string,
  ) => void

  clearPageObjects: (
    documentId: string,
    pageNumber: number,
  ) => void

  undo: (
    documentId: string,
  ) => void

  redo: (
    documentId: string,
  ) => void

  markSaved: (
    documentId: string,
  ) => void

  resetSession: (
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

function cloneObjects(
  objects: EditorObject[],
): EditorObject[] {
  return structuredClone(
    objects,
  )
}

function createSession(
  documentId: string,
): EditorDocumentSession {
  return {
    documentId,

    activeTool: 'select',
    selectedObjectId: null,

    objects: [],

    history: [[]],
    historyIndex: 0,

    isDirty: false,
  }
}

function commitObjects(
  session: EditorDocumentSession,
  objects: EditorObject[],
): EditorDocumentSession {
  const nextObjects =
    cloneObjects(objects)

  const historyBeforeCurrent =
    session.history.slice(
      0,
      session.historyIndex + 1,
    )

  const nextHistory = [
    ...historyBeforeCurrent,
    nextObjects,
  ]

  /*
   * Batasi histori agar penggunaan memori
   * tidak terus bertambah.
   */
  const limitedHistory =
    nextHistory.length > 50
      ? nextHistory.slice(-50)
      : nextHistory

  return {
    ...session,

    objects: nextObjects,

    history: limitedHistory,

    historyIndex:
      limitedHistory.length - 1,

    isDirty: true,
  }
}

export const useEditorStore =
  create<EditorState>(
    (set) => ({
      sessions: {},

      initializeSession: (
        documentId,
      ) => {
        set((state) => {
          if (
            state.sessions[
              documentId
            ]
          ) {
            return state
          }

          return {
            sessions: {
              ...state.sessions,

              [documentId]:
                createSession(
                  documentId,
                ),
            },
          }
        })
      },

      setActiveTool: (
        documentId,
        tool,
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

                activeTool: tool,

                selectedObjectId:
                  tool === 'select'
                    ? session
                        .selectedObjectId
                    : null,
              },
            },
          }
        })
      },

      selectObject: (
        documentId,
        objectId,
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

                selectedObjectId:
                  objectId,
              },
            },
          }
        })
      },

      addObject: (
        documentId,
        object,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const nextSession =
            commitObjects(
              session,
              [
                ...session.objects,
                object,
              ],
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...nextSession,

                selectedObjectId:
                  object.id,

                activeTool:
                  'select',
              },
            },
          }
        })
      },

      updateObject: (
        documentId,
        objectId,
        changes,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const nextObjects =
            session.objects.map(
              (object) =>
                object.id ===
                objectId
                  ? {
                      ...object,
                      ...changes,
                    } as EditorObject
                  : object,
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]:
                commitObjects(
                  session,
                  nextObjects,
                ),
            },
          }
        })
      },

      updateObjectRect: (
        documentId,
        objectId,
        rect,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const nextObjects =
            session.objects.map(
              (object) =>
                object.id ===
                objectId
                  ? {
                      ...object,
                      rect,
                    }
                  : object,
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]:
                commitObjects(
                  session,
                  nextObjects,
                ),
            },
          }
        })
      },

      deleteObject: (
        documentId,
        objectId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const nextObjects =
            session.objects.filter(
              (object) =>
                object.id !==
                objectId,
            )

          const nextSession =
            commitObjects(
              session,
              nextObjects,
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...nextSession,

                selectedObjectId:
                  session
                    .selectedObjectId ===
                  objectId
                    ? null
                    : session
                        .selectedObjectId,
              },
            },
          }
        })
      },

      duplicateObject: (
        documentId,
        objectId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const sourceObject =
            session.objects.find(
              (object) =>
                object.id ===
                objectId,
            )

          if (!sourceObject) {
            return state
          }

          const duplicatedObject: EditorObject =
            {
              ...structuredClone(
                sourceObject,
              ),

              id: createId(
                sourceObject.kind,
              ),

              rect: {
                ...sourceObject.rect,

                x:
                  sourceObject.rect.x +
                  12,

                y:
                  sourceObject.rect.y +
                  12,
              },
            }

          const nextSession =
            commitObjects(
              session,
              [
                ...session.objects,
                duplicatedObject,
              ],
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...nextSession,

                selectedObjectId:
                  duplicatedObject.id,
              },
            },
          }
        })
      },

      clearPageObjects: (
        documentId,
        pageNumber,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (!session) {
            return state
          }

          const nextObjects =
            session.objects.filter(
              (object) =>
                object.pageNumber !==
                pageNumber,
            )

          const nextSession =
            commitObjects(
              session,
              nextObjects,
            )

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...nextSession,
                selectedObjectId:
                  null,
              },
            },
          }
        })
      },

      undo: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (
            !session ||
            session.historyIndex <= 0
          ) {
            return state
          }

          const nextIndex =
            session.historyIndex - 1

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                objects:
                  cloneObjects(
                    session.history[
                      nextIndex
                    ],
                  ),

                historyIndex:
                  nextIndex,

                selectedObjectId:
                  null,

                isDirty:
                  nextIndex !== 0,
              },
            },
          }
        })
      },

      redo: (
        documentId,
      ) => {
        set((state) => {
          const session =
            state.sessions[
              documentId
            ]

          if (
            !session ||
            session.historyIndex >=
              session.history.length -
                1
          ) {
            return state
          }

          const nextIndex =
            session.historyIndex + 1

          return {
            sessions: {
              ...state.sessions,

              [documentId]: {
                ...session,

                objects:
                  cloneObjects(
                    session.history[
                      nextIndex
                    ],
                  ),

                historyIndex:
                  nextIndex,

                selectedObjectId:
                  null,

                isDirty: true,
              },
            },
          }
        })
      },

      markSaved: (
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
                isDirty: false,
              },
            },
          }
        })
      },

      resetSession: (
        documentId,
      ) => {
        set((state) => ({
          sessions: {
            ...state.sessions,

            [documentId]:
              createSession(
                documentId,
              ),
          },
        }))
      },
    }),
  )