import { AppShell } from './components/layout/AppShell'
import { HomePage } from './features/home/HomePage'
import { PlaceholderPage } from './features/home/PlaceholderPage'
import { ViewerPage } from './features/viewer/ViewerPage'
import { useAppStore } from './store/useAppStore'
import {
  OrganizePage,
} from './features/organize/OrganizePage'

function WorkspaceContent() {
  const workspace = useAppStore((state) => state.workspace)

  switch (workspace) {
    case 'home':
      return <HomePage />
    case 'viewer':
      return <ViewerPage />
    case 'editor':
      return <PlaceholderPage title="Hard Edit PDF" />
    case 'organize':
      return <OrganizePage />
    case 'compress':
      return <PlaceholderPage title="Kompres PDF" />
    case 'convert':
      return <PlaceholderPage title="Konversi Dokumen" />
    case 'print':
      return <PlaceholderPage title="Cetak Dokumen" />
  }
}

export default function App() {
  return (
    <AppShell>
      <WorkspaceContent />
    </AppShell>
  )
}
