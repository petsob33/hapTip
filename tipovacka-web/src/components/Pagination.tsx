import { IconChevronLeft, IconChevronRight } from './icons'

interface PaginationProps {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) {
    return null
  }

  return (
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Předchozí strana"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-900/5 disabled:opacity-30"
      >
        <IconChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium text-slate-500">
        Strana {currentPage} z {lastPage}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        aria-label="Další strana"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-900/5 disabled:opacity-30"
      >
        <IconChevronRight className="size-4" />
      </button>
    </div>
  )
}
