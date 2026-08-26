import { useState } from 'react'
import { useUntippedMatches } from '../../api/hooks/useUntippedMatches'
import Pagination from '../../components/Pagination'
import UntippedMatchRow from './UntippedMatchRow'

export default function Zapasy() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useUntippedMatches(page)

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Zápasy k tipování</h1>

      {isLoading && <p className="text-sm text-gray-500">Načítání…</p>}
      {isError && <p className="text-sm text-red-600">Zápasy se nepodařilo načíst.</p>}
      {data && data.data.length === 0 && (
        <p className="text-sm text-gray-500">Žádné netipované zápasy — vše je otipováno.</p>
      )}
      {data && data.data.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {data.data.map((match) => (
              <UntippedMatchRow key={match.id} match={match} />
            ))}
          </ul>
          <Pagination
            currentPage={data.meta.current_page}
            lastPage={data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
