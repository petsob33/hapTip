import { useState } from 'react'
import { useMatches } from '../../api/hooks/useMatches'
import Pagination from '../../components/Pagination'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import MatchesTable from './MatchesTable'
import MatchCreateForm from './MatchCreateForm'
import MatchEditForm from './MatchEditForm'
import ResultsImport from './ResultsImport'
import ManualResultsImport from './ManualResultsImport'
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
      <PageHeader
        title="Admin: Zápasy"
        action={
          !showCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              Nový zápas
            </button>
          )
        }
      />

      <ManualResultsImport />
      <ResultsImport />

      {showCreate && <MatchCreateForm onCreated={closeForms} onCancel={closeForms} />}
      {editingMatch && (
        <MatchEditForm match={editingMatch} onSaved={closeForms} onCancel={closeForms} />
      )}

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Zápasy se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && <InfoBox>Zatím žádné zápasy.</InfoBox>}
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
