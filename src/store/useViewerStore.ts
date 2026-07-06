import { create } from 'zustand'

export const MIN_VIEWER_SCALE = 0.4
export const MAX_VIEWER_SCALE = 3
export const VIEWER_SCALE_STEP = 0.15

export type FitMode = 'custom' | 'width' | 'page'

type ViewerState = {
  pageNumber: number
  scale: number
  rotation: number
  fitMode: FitMode

  setPageNumber: (pageNumber: number) => void

  setViewScale: (
    scale: number,
    fitMode?: FitMode,
  ) => void

  rotateClockwise: () => void
  resetView: () => void
}

function clampScale(scale: number): number {
  return Math.min(
    Math.max(scale, MIN_VIEWER_SCALE),
    MAX_VIEWER_SCALE,
  )
}

export const useViewerStore = create<ViewerState>(
  (set) => ({
    pageNumber: 1,
    scale: 1,
    rotation: 0,
    fitMode: 'custom',

    setPageNumber: (pageNumber) => {
      set({ pageNumber })
    },

    setViewScale: (
      scale,
      fitMode = 'custom',
    ) => {
      set({
        scale: clampScale(scale),
        fitMode,
      })
    },

    rotateClockwise: () => {
      set((state) => ({
        rotation: (state.rotation + 90) % 360,
      }))
    },

    resetView: () => {
      set({
        pageNumber: 1,
        scale: 1,
        rotation: 0,
        fitMode: 'custom',
      })
    },
  }),
)