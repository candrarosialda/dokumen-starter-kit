import { create } from 'zustand'

export type Workspace =
  | 'home'
  | 'viewer'
  | 'editor'
  | 'organize'
  | 'compress'
  | 'convert'
  | 'print'

export type OpenDocument = {
  id: string

  filePath: string
  fileName: string

  data: Uint8Array

  /*
   * Disiapkan untuk editor.
   * Saat ini selalu false.
   */
  isDirty: boolean

  openedAt: number
}

/*
 * Alias sementara agar file lama yang
 * masih mengimpor ActiveDocument tidak error.
 */
export type ActiveDocument = OpenDocument

export type AppState = {
  workspace: Workspace

  documents: OpenDocument[]
  activeDocumentId: string | null

  statusMessage: string

  setWorkspace: (
    workspace: Workspace,
  ) => void

  setStatusMessage: (
    message: string,
  ) => void

  openDocument: (
    document: Omit<
      OpenDocument,
      'id' | 'isDirty' | 'openedAt'
    >,
  ) => string

  activateDocument: (
    documentId: string,
  ) => void

  closeDocument: (
    documentId: string,
  ) => void

  closeOtherDocuments: (
    documentId: string,
  ) => void

  closeAllDocuments: () => void

  markDocumentDirty: (
    documentId: string,
    isDirty: boolean,
  ) => void

  replaceDocumentData: (
    documentId: string,
    data: Uint8Array,
  ) => void
}

function createDocumentId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID()
  }

  return (
    `${Date.now()}-` +
    `${Math.random()
      .toString(36)
      .slice(2)}`
  )
}

export function normalizeDocumentPath(
  filePath: string,
): string {
  /*
   * Windows tidak membedakan huruf besar
   * dan kecil pada sebagian besar filesystem.
   */
  return filePath
    .replaceAll('\\', '/')
    .toLocaleLowerCase()
}

export const selectActiveDocument = (
  state: AppState,
): OpenDocument | null => {
  if (!state.activeDocumentId) {
    return null
  }

  return (
    state.documents.find(
      (document) =>
        document.id ===
        state.activeDocumentId,
    ) ?? null
  )
}

function workspaceNeedsDocument(
  workspace: Workspace,
): boolean {
  return (
    workspace === 'viewer' ||
    workspace === 'editor' ||
    workspace === 'print'
  )
}

export const useAppStore =
  create<AppState>(
    (set, get) => ({
      workspace: 'home',

      documents: [],
      activeDocumentId: null,

      statusMessage: 'Siap',

      setWorkspace: (workspace) => {
        set({ workspace })
      },

      setStatusMessage: (
        statusMessage,
      ) => {
        set({ statusMessage })
      },

      openDocument: (
        document,
      ) => {
        const state = get()

        const normalizedPath =
          normalizeDocumentPath(
            document.filePath,
          )

        const existing =
          state.documents.find(
            (currentDocument) =>
              normalizeDocumentPath(
                currentDocument.filePath,
              ) === normalizedPath,
          )

        if (existing) {
          set({
            activeDocumentId:
              existing.id,
          })

          return existing.id
        }

        const documentId =
          createDocumentId()

        const newDocument:
          OpenDocument = {
            id: documentId,

            filePath:
              document.filePath,

            fileName:
              document.fileName,

            data: document.data,

            isDirty: false,

            openedAt:
              Date.now(),
          }

        set((currentState) => ({
          documents: [
            ...currentState.documents,
            newDocument,
          ],

          activeDocumentId:
            documentId,
        }))

        return documentId
      },

      activateDocument: (
        documentId,
      ) => {
        const exists =
          get().documents.some(
            (document) =>
              document.id ===
              documentId,
          )

        if (!exists) {
          return
        }

        set({
          activeDocumentId:
            documentId,
        })
      },

      closeDocument: (
        documentId,
      ) => {
        set((state) => {
          const closingIndex =
            state.documents.findIndex(
              (document) =>
                document.id ===
                documentId,
            )

          if (closingIndex === -1) {
            return state
          }

          const nextDocuments =
            state.documents.filter(
              (document) =>
                document.id !==
                documentId,
            )

          let nextActiveDocumentId =
            state.activeDocumentId

          /*
           * Apabila tab aktif ditutup,
           * pilih tab di sebelah kanannya.
           *
           * Jika tidak ada, pilih sebelah kiri.
           */
          if (
            state.activeDocumentId ===
            documentId
          ) {
            nextActiveDocumentId =
              nextDocuments[
                Math.min(
                  closingIndex,
                  nextDocuments.length -
                    1,
                )
              ]?.id ?? null
          }

          const nextWorkspace =
            nextActiveDocumentId ===
              null &&
            workspaceNeedsDocument(
              state.workspace,
            )
              ? 'home'
              : state.workspace

          return {
            documents:
              nextDocuments,

            activeDocumentId:
              nextActiveDocumentId,

            workspace:
              nextWorkspace,
          }
        })
      },

      closeOtherDocuments: (
        documentId,
      ) => {
        set((state) => {
          const selectedDocument =
            state.documents.find(
              (document) =>
                document.id ===
                documentId,
            )

          if (!selectedDocument) {
            return state
          }

          return {
            documents: [
              selectedDocument,
            ],

            activeDocumentId:
              selectedDocument.id,
          }
        })
      },

      closeAllDocuments: () => {
        set((state) => ({
          documents: [],

          activeDocumentId: null,

          workspace:
            workspaceNeedsDocument(
              state.workspace,
            )
              ? 'home'
              : state.workspace,
        }))
      },

      markDocumentDirty: (
        documentId,
        isDirty,
      ) => {
        set((state) => ({
          documents:
            state.documents.map(
              (document) =>
                document.id ===
                documentId
                  ? {
                      ...document,
                      isDirty,
                    }
                  : document,
            ),
        }))
      },

      replaceDocumentData: (
        documentId,
        data,
      ) => {
        set((state) => ({
          documents:
            state.documents.map(
              (document) =>
                document.id ===
                documentId
                  ? {
                      ...document,
                      data,
                      isDirty: false,
                    }
                  : document,
            ),
        }))
      },
    }),
  )