import { useState } from 'react'
import { useMatches } from '../../api/hooks/useMatches'
import Pagination from '../../components/Pagination'
import MatchesTable from './MatchesTable'
import MatchCreateForm from './MatchCreateForm'
import MatchEditForm from './MatchEditForm'
import type { Match } from '../../api/types'

export default function AdminMatches() {
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const { data, isLoading, isError } = useMatches(page)

  function openCreate() {
    setEditingMatch(null)
    setShowCreate(true)
  }

  function openEdit(match: Match) {
    setShowCreate(false)
    setEditingMatch(match)
  }

  function closeForms() {
    setShowCreate(false)
    setEditingMatch(null)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin: Zápasy</h1>
        {!showCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Nový zápas
          </button>
        )}
      </div>

      {showCreate && <MatchCreateForm onCreated={closeForms} onCancel={closeForms} />}
      {editingMatch && (
        <MatchEditForm match={editingMatch} onSaved={closeForms} onCancel={closeForms} />
      )}

      {isLoading && <p className="text-sm text-gray-500">Načítání…</p>}
      {isError && <p className="text-sm text-red-600">Zápasy se nepodařilo načíst.</p>}
      {data && data.data.length === 0 && (
        <p className="text-sm text-gray-500">Zatím žádné zápasy.</p>
      )}
      {data && data.data.length > 0 && (
        <>
          <MatchesTable matches={data.data} onEdit={openEdit} />
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
