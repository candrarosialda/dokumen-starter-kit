import {
  Combine,
  FileOutput,
  FilePenLine,
  FileText,
  Gauge,
  House,
  Printer,
  Shrink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { useAppStore, type Workspace } from '../../store/useAppStore'

const navigation: Array<{ id: Workspace; label: string; icon: LucideIcon }> = [
  { id: 'home', label: 'Beranda', icon: House },
  { id: 'viewer', label: 'Lihat PDF', icon: FileText },
  { id: 'editor', label: 'Edit PDF', icon: FilePenLine },
  { id: 'organize', label: 'Kelola Halaman', icon: Combine },
  { id: 'compress', label: 'Kompres', icon: Shrink },
  { id: 'convert', label: 'Konversi', icon: FileOutput },
  { id: 'print', label: 'Cetak', icon: Printer },
]

export function Sidebar() {
  const workspace = useAppStore((state) => state.workspace)
  const setWorkspace = useAppStore((state) => state.setWorkspace)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-950/95 px-3 py-4">
      <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</div>
      <nav className="space-y-1">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setWorkspace(id)}
            className={clsx(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
              workspace === id
                ? 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Gauge size={15} className="text-emerald-400" />
          Local Processing
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Dokumen diproses di komputer, bukan dikirim ke server.</p>
      </div>
    </aside>
  )
}
