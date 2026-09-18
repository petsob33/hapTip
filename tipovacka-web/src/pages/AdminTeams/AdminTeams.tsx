import { useState } from 'react'
import { useTeams } from '../../api/hooks/useTeams'
import Pagination from '../../components/Pagination'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
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
      <PageHeader
        title="Admin: Týmy"
        action={
          !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              Nový tým
            </button>
          )
        }
      />

      {showForm && <TeamForm onCreated={closeForm} onCancel={closeForm} />}

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Týmy se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && <InfoBox>Zatím žádné týmy.</InfoBox>}
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
