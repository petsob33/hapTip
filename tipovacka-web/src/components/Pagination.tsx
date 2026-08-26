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
    <div className="mt-4 flex items-center justify-between text-sm">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
      >
        Předchozí
      </button>
      <span className="text-gray-600">
        Strana {currentPage} z {lastPage}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
      >
        Další
      </button>
    </div>
  )
}
