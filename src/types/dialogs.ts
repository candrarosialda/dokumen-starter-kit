export type SelectedPdfFile = {
  filePath: string
  fileName: string
  sizeBytes: number
}

export type SelectedOrganizerAsset = {
  filePath: string
  fileName: string
  sizeBytes: number
  extension: string
  kind: 'pdf' | 'image'
}