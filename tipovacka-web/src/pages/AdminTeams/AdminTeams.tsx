import { useState } from 'react'
import { useTeams } from '../../api/hooks/useTeams'
import Pagination from '../../components/Pagination'
import TeamsTable from './TeamsTable'
import TeamForm from './TeamForm'

export default function AdminTeams() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading, isError } = useTeams(page)

  function closeForm() {
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin: Týmy</h1>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Nový tým
          </button>
        )}
      </div>

      {showForm && <TeamForm onCreated={closeForm} onCancel={closeForm} />}

      {isLoading && <p className="text-sm text-gray-500">Načítání…</p>}
      {isError && <p className="text-sm text-red-600">Týmy se nepodařilo načíst.</p>}
      {data && data.data.length === 0 && <p className="text-sm text-gray-500">Zatím žádné týmy.</p>}
      {data && data.data.length > 0 && (
        <>
          <TeamsTable teams={data.data} />
          <Pagination
            currentPage={data.current_page}
            lastPage={data.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
