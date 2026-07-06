import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'

type PdfSearchBarProps = {
  query: string

  onQueryChange: (
    query: string,
  ) => void

  onSearch: () => void
  onPrevious: () => void
  onNext: () => void
  onClear: () => void

  isSearching: boolean
  progress: number

  totalMatches: number
  activeMatchIndex: number

  disabled?: boolean
}

export function PdfSearchBar({
  query,
  onQueryChange,
  onSearch,
  onPrevious,
  onNext,
  onClear,
  isSearching,
  progress,
  totalMatches,
  activeMatchIndex,
  disabled = false,
}: PdfSearchBarProps) {
  const hasMatches =
    totalMatches > 0

  return (
    <form
      className="flex h-9 items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/80 px-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      {isSearching ? (
        <LoaderCircle
          className="animate-spin text-blue-300"
          size={16}
        />
      ) : (
        <Search
          className="text-slate-500"
          size={16}
        />
      )}

      <input
        type="search"
        value={query}
        disabled={
          disabled ||
          isSearching
        }
        onChange={(event) =>
          onQueryChange(
            event.target.value,
          )
        }
        placeholder="Cari teks..."
        className="w-44 bg-transparent px-1 text-xs text-slate-200 outline-none placeholder:text-slate-600"
        aria-label="Cari teks dalam PDF"
      />

      <span className="min-w-16 text-center text-[11px] text-slate-500">
        {isSearching
          ? `${progress}%`
          : hasMatches
            ? `${activeMatchIndex + 1} / ${totalMatches}`
            : '0 hasil'}
      </span>

      <button
        type="button"
        className="toolbar-button !h-7 !w-7"
        disabled={
          !hasMatches ||
          isSearching
        }
        onClick={onPrevious}
        title="Hasil sebelumnya"
      >
        <ChevronUp size={15} />
      </button>

      <button
        type="button"
        className="toolbar-button !h-7 !w-7"
        disabled={
          !hasMatches ||
          isSearching
        }
        onClick={onNext}
        title="Hasil berikutnya"
      >
        <ChevronDown size={15} />
      </button>

      <button
        type="button"
        className="toolbar-button !h-7 !w-7"
        disabled={
          !query &&
          !hasMatches
        }
        onClick={onClear}
        title="Bersihkan pencarian"
      >
        <X size={15} />
      </button>
    </form>
  )
}