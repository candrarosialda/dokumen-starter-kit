import {
  FileText,
} from 'lucide-react'

import {
  selectActiveDocument,
  useAppStore,
} from '../../store/useAppStore'

export function StatusBar() {
  const statusMessage =
    useAppStore(
      (state) =>
        state.statusMessage,
    )

  const activeDocument =
    useAppStore(
      selectActiveDocument,
    )

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950 px-4 text-[11px] text-slate-500">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

        <span className="truncate">
          {statusMessage}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        {activeDocument ? (
          <>
            <FileText
              size={12}
              className="shrink-0"
            />

            <span className="max-w-72 truncate">
              {activeDocument.fileName}
            </span>

            {activeDocument.isDirty && (
              <span className="text-amber-400">
                Belum disimpan
              </span>
            )}
          </>
        ) : (
          <span>
            Tidak ada dokumen aktif
          </span>
        )}
      </div>
    </footer>
  )
}