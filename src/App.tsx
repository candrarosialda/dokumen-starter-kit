import { AppShell } from './components/layout/AppShell'
import { HomePage } from './features/home/HomePage'
import { PlaceholderPage } from './features/home/PlaceholderPage'
import { ViewerPage } from './features/viewer/ViewerPage'
import { OrganizePage } from './features/organize/OrganizePage'
import { EditorPage } from './features/editor/EditorPage'
import { useAppStore } from './store/useAppStore'

function WorkspaceContent() {
  const workspace = useAppStore(
    (state) => state.workspace,
  )

  switch (workspace) {
    case 'home':
      return <HomePage />

    case 'viewer':
      return <ViewerPage />

    case 'editor':
      return <EditorPage />

    case 'organize':
      return <OrganizePage />

    case 'compress':
      return (
        <PlaceholderPage title="Kompres PDF" />
      )

    case 'convert':
      return (
        <PlaceholderPage title="Konversi Dokumen" />
      )

    case 'print':
      return (
        <PlaceholderPage title="Cetak Dokumen" />
      )

    default:
      return <HomePage />
  }
}

export default function App() {
  return (
    <AppShell>
      <WorkspaceContent />
    </AppShell>
  )
}