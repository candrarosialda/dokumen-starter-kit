import type {
  ReactNode,
} from 'react'

import {
  JobEventBridge,
} from '../jobs/JobEventBridge'

import {
  DocumentTabs,
} from './DocumentTabs'

import {
  Sidebar,
} from './Sidebar'

import {
  StatusBar,
} from './StatusBar'

import {
  TitleBar,
} from './TitleBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <>
      <JobEventBridge />

      <div className="flex h-screen flex-col overflow-hidden bg-slate-900 text-slate-100">
        <TitleBar />

        <div className="flex min-h-0 flex-1">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <DocumentTabs />

            <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.13),_transparent_35%)]">
              {children}
            </main>
          </div>
        </div>

        <StatusBar />
      </div>
    </>
  )
}