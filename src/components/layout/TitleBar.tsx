import { Maximize2, Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void window.desktopAPI.window.isMaximized().then(setMaximized)
  }, [])

  async function toggleMaximize() {
    setMaximized(await window.desktopAPI.window.maximizeToggle())
  }

  return (
    <header className="app-drag flex h-11 items-center justify-between border-b border-white/10 bg-slate-950 px-3 text-slate-200">
      <div className="flex items-center gap-3">
        <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-white shadow-lg shadow-blue-950/40">
          DS
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Dokumen Starter Kit</p>
          <p className="mt-1 text-[10px] leading-none text-slate-500">Document workspace</p>
        </div>
      </div>

      <div className="app-no-drag -mr-3 flex h-11 items-stretch">
        <button className="title-button" type="button" aria-label="Minimize" onClick={() => void window.desktopAPI.window.minimize()}>
          <Minus size={16} />
        </button>
        <button className="title-button" type="button" aria-label="Maximize" onClick={() => void toggleMaximize()}>
          {maximized ? <Square size={13} /> : <Maximize2 size={15} />}
        </button>
        <button className="title-button hover:!bg-red-600 hover:!text-white" type="button" aria-label="Close" onClick={() => void window.desktopAPI.window.close()}>
          <X size={17} />
        </button>
      </div>
    </header>
  )
}
