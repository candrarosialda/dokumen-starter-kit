import { Combine, FileOutput, FilePenLine, FileText, Printer, Shrink } from 'lucide-react'
import { FeatureCard } from '../../components/common/FeatureCard'
import { openPdfFromDialog } from '../../lib/openPdf'
import { useAppStore, type Workspace } from '../../store/useAppStore'
import {
  EngineJobTestPanel,
} from '../../components/jobs/EngineJobTestPanel'

export function HomePage() {
  const setWorkspace = useAppStore((state) => state.setWorkspace)
  const setStatusMessage = useAppStore((state) => state.setStatusMessage)

  function goTo(workspace: Workspace, label: string) {
    setWorkspace(workspace)
    setStatusMessage(`${label} belum dihubungkan ke engine.`)
  }

  return (
    <section className="mx-auto max-w-7xl p-8 lg:p-12">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-400">Dokumen Starter Kit</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white lg:text-5xl">
            Semua alat dokumen dalam satu workspace desktop.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Fondasi aplikasi lokal untuk membaca, mengedit, menggabungkan, mengompres, mengonversi, dan mencetak dokumen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void openPdfFromDialog()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/50 transition hover:bg-blue-500"
        >
          <FileText size={18} />
          Buka PDF
        </button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FeatureCard title="Lihat PDF" description="Buka dokumen, navigasi halaman, zoom, pencarian, dan thumbnail." icon={FileText} onClick={() => void openPdfFromDialog()} />
        <FeatureCard title="Hard Edit PDF" description="Ubah teks, gambar, anotasi, redaction, dan objek halaman." icon={FilePenLine} badge="Tahap 5" onClick={() => goTo('editor', 'Editor PDF')} />
        <FeatureCard title="Kelola Halaman" description="Tambah, hapus, putar, urutkan, pecah, dan gabungkan halaman." icon={Combine} badge="Aktif" onClick={() => {    setWorkspace('organize') ,setStatusMessage('Merge PDF siap digunakan.',    )}} />
        <FeatureCard title="Kompres PDF" description="Kecilkan ukuran dokumen dengan pilihan kualitas dan resolusi." icon={Shrink} badge="Tahap 6" onClick={() => goTo('compress', 'Kompres PDF')} />
        <FeatureCard title="Konversi Dokumen" description="PDF, Word, Excel, dan PowerPoint melalui engine lokal." icon={FileOutput} badge="Tahap 7" onClick={() => goTo('convert', 'Konversi dokumen')} />
        <FeatureCard title="Cetak File" description="Preview, page range, ukuran kertas, orientasi, dan printer tujuan." icon={Printer} badge="Tahap 8" onClick={() => goTo('print', 'Print')} />
      </div>
      <EngineJobTestPanel />
    </section>
  )
}
