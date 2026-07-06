import type { LucideIcon } from 'lucide-react'

export type FeatureCardProps = {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
  onClick: () => void
}

export function FeatureCard({ title, description, icon: Icon, badge, onClick }: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-40 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900"
    >
      <div className="mb-5 grid size-11 place-items-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-400/20 transition group-hover:bg-blue-500/20">
        <Icon size={22} />
      </div>
      <h3 className="font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
          {badge}
        </span>
      )}
    </button>
  )
}
