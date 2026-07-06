import { Construction } from 'lucide-react'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="grid min-h-full place-items-center p-8">
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-300/20">
          <Construction size={30} />
        </div>
        <h2 className="mt-5 text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">Halaman dan routenya sudah tersedia. Engine fitur akan dipasang sesuai urutan milestone.</p>
      </div>
    </section>
  )
}
