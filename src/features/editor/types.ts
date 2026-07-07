export type EditorTool =
  | 'select'
  | 'text'
  | 'whiteout'
  | 'redact'
  | 'image'
  | 'rectangle'
  | 'line'

export type PdfPoint = {
  x: number
  y: number
}

export type PdfRect = {
  x: number
  y: number
  width: number
  height: number
}

type EditorObjectBase = {
  id: string
  pageNumber: number
  rect: PdfRect

  rotation: number
  opacity: number

  locked: boolean
  hidden: boolean
}

export type EditorTextObject =
  EditorObjectBase & {
    kind: 'text'

    text: string
    fontFamily: string
    fontSize: number

    color: string

    bold: boolean
    italic: boolean

    align:
      | 'left'
      | 'center'
      | 'right'
  }

export type EditorWhiteoutObject =
  EditorObjectBase & {
    kind: 'whiteout'

    fillColor: string
  }

export type EditorRedactionObject =
  EditorObjectBase & {
    kind: 'redact'

    fillColor: string
    replacementText: string
  }

export type EditorImageObject =
  EditorObjectBase & {
    kind: 'image'

    sourceFile: string
    sourceFileName: string
    dataUrl: string

    keepAspectRatio: boolean
  }

export type EditorRectangleObject =
  EditorObjectBase & {
    kind: 'rectangle'

    fillColor: string
    strokeColor: string
    strokeWidth: number
  }

export type EditorLineObject =
  EditorObjectBase & {
    kind: 'line'

    start: PdfPoint
    end: PdfPoint

    strokeColor: string
    strokeWidth: number
  }

export type EditorObject =
  | EditorTextObject
  | EditorWhiteoutObject
  | EditorRedactionObject
  | EditorImageObject
  | EditorRectangleObject
  | EditorLineObject