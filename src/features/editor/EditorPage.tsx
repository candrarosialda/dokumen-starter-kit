import {
  ImagePlus,
  MousePointer2,
  Redo2,
  Save,
  Shapes,
  Type,
  Undo2,
  XSquare,
} from 'lucide-react'

import {
  useEffect,
} from 'react'

import {
  selectActiveDocument,
  useAppStore,
} from '../../store/useAppStore'

import {
  useEditorStore,
} from '../../store/useEditorStore'

import type {
  EditorTool,
} from './types'

type ToolButtonProps = {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}

function ToolButton({
  active,
  label,
  icon,
  onClick,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={[
        'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',

        active
          ? 'border-blue-500 bg-blue-500/15 text-blue-300'
          : 'border-slate-700 text-slate-400 hover:bg-white/5 hover:text-white',
      ].join(' ')}
    >
      {icon}

      <span className="hidden xl:inline">
        {label}
      </span>
    </button>
  )
}

export function EditorPage() {
  const activeDocument =
    useAppStore(
      selectActiveDocument,
    )

  const initializeSession =
    useEditorStore(
      (state) =>
        state.initializeSession,
    )

  const session =
    useEditorStore(
      (state) =>
        activeDocument
          ? state.sessions[
              activeDocument.id
            ]
          : undefined,
    )

  const setActiveTool =
    useEditorStore(
      (state) =>
        state.setActiveTool,
    )

  const undo =
    useEditorStore(
      (state) =>
        state.undo,
    )

  const redo =
    useEditorStore(
      (state) =>
        state.redo,
    )

  useEffect(() => {
    if (!activeDocument) {
      return
    }

    initializeSession(
      activeDocument.id,
    )
  }, [
    activeDocument,
    initializeSession,
  ])

  if (!activeDocument) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="max-w-md rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center">
          <MousePointer2
            size={48}
            className="mx-auto text-slate-700"
          />

          <h2 className="mt-5 text-xl font-bold text-white">
            Belum ada PDF aktif
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buka PDF terlebih dahulu,
            lalu masuk kembali ke menu
            Hard Edit.
          </p>
        </div>
      </div>
    )
  }

  const activeTool: EditorTool =
    session?.activeTool ??
    'select'

  const documentId =
    activeDocument.id

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToolButton
            active={
              activeTool === 'select'
            }
            label="Pilih"
            icon={
              <MousePointer2
                size={17}
              />
            }
            onClick={() =>
              setActiveTool(
                documentId,
                'select',
              )
            }
          />

          <ToolButton
            active={
              activeTool === 'text'
            }
            label="Teks"
            icon={
              <Type size={17} />
            }
            onClick={() =>
              setActiveTool(
                documentId,
                'text',
              )
            }
          />

          <ToolButton
            active={
              activeTool ===
              'whiteout'
            }
            label="Tutup Area"
            icon={
              <XSquare size={17} />
            }
            onClick={() =>
              setActiveTool(
                documentId,
                'whiteout',
              )
            }
          />

          <ToolButton
            active={
              activeTool ===
              'redact'
            }
            label="Redaksi"
            icon={
              <XSquare size={17} />
            }
            onClick={() =>
              setActiveTool(
                documentId,
                'redact',
              )
            }
          />

          <ToolButton
            active={
              activeTool === 'image'
            }
            label="Gambar"
            icon={
              <ImagePlus
                size={17}
              />
            }
            onClick={() =>
              setActiveTool(
                documentId,
                'image',
              )
            }
          />

          <ToolButton
            active={
              activeTool ===
              'rectangle'
            }
            label="Bentuk"
            icon={
              <Shapes size={17} />
            }
            onClick={() =>
              setActiveTool(
                documentId,
                'rectangle',
              )
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              !session ||
              session.historyIndex <= 0
            }
            onClick={() =>
              undo(documentId)
            }
            className="toolbar-button !h-10 !w-10"
            title="Undo"
          >
            <Undo2 size={17} />
          </button>

          <button
            type="button"
            disabled={
              !session ||
              session.historyIndex >=
                session.history.length -
                  1
            }
            onClick={() =>
              redo(documentId)
            }
            className="toolbar-button !h-10 !w-10"
            title="Redo"
          >
            <Redo2 size={17} />
          </button>

          <button
            type="button"
            disabled={
              !session?.isDirty
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={17} />

            Simpan
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_280px]">
        <main className="grid min-h-0 place-items-center overflow-auto bg-slate-900/50 p-8">
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-12 py-16 text-center">
            <MousePointer2
              size={42}
              className="mx-auto text-slate-700"
            />

            <p className="mt-4 font-semibold text-slate-300">
              Canvas editor akan dibuat
              pada Tahap 6B
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Alat aktif:
              {' '}
              {activeTool}
            </p>
          </div>
        </main>

        <aside className="border-l border-slate-800 bg-slate-950/70 p-5">
          <h2 className="font-semibold text-white">
            Properti
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Pilih objek pada halaman untuk
            mengubah ukuran, posisi, warna,
            teks, atau transparansinya.
          </p>

          <div className="mt-5 rounded-xl bg-slate-900/70 p-4 text-xs text-slate-500">
            Jumlah objek:
            {' '}
            {session?.objects.length ??
              0}
          </div>
        </aside>
      </div>
    </section>
  )
}