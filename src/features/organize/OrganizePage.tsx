import {
  Combine,
  LayoutGrid,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  MergePdfPanel,
} from './MergePdfPanel'

import {
  PageOrganizerPanel,
} from './PageOrganizerPanel'

type OrganizeTab =
  | 'pages'
  | 'merge'

export function OrganizePage() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<OrganizeTab>(
      'pages',
    )

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center border-b border-slate-800 bg-slate-950/70 px-6">
        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'pages',
            )
          }
          className={[
            'flex h-14 items-center gap-2 border-b-2 px-5 text-sm font-semibold transition',

            activeTab ===
            'pages'
              ? 'border-blue-500 text-blue-300'
              : 'border-transparent text-slate-500 hover:text-slate-200',
          ].join(' ')}
        >
          <LayoutGrid
            size={17}
          />

          Atur Halaman
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'merge',
            )
          }
          className={[
            'flex h-14 items-center gap-2 border-b-2 px-5 text-sm font-semibold transition',

            activeTab ===
            'merge'
              ? 'border-blue-500 text-blue-300'
              : 'border-transparent text-slate-500 hover:text-slate-200',
          ].join(' ')}
        >
          <Combine
            size={17}
          />

          Gabungkan PDF
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab ===
        'pages' ? (
          <PageOrganizerPanel />
        ) : (
          <MergePdfPanel />
        )}
      </div>
    </section>
  )
}