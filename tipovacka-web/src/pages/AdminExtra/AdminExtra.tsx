import { useState } from 'react'
import { useDeleteExtra, useExtras } from '../../api/hooks/useExtra'
import Pagination from '../../components/Pagination'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import ExtraTable from './ExtraTable'
import ExtraForm from './ExtraForm'
import type { Extra } from '../../api/types'

export default function AdminExtra() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null)
  const { data, isLoading, isError } = useExtras(page)
  const deleteExtra = useDeleteExtra()

  function openCreate() {
    setEditingExtra(null)
    setShowForm(true)
  }

  function openEdit(extra: Extra) {
    setEditingExtra(extra)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingExtra(null)
  }

  function handleDelete(extra: Extra) {
    if (confirm(`Opravdu smazat "${extra.e_pril}"?`)) {
      deleteExtra.mutate(extra.e_id)
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin: Extra tipy"
        action={
          !showForm && (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              Nový extra tip
            </button>
          )
        }
      />

      {showForm && <ExtraForm initial={editingExtra} onSaved={closeForm} onCancel={closeForm} />}

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Extra tipy se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && <InfoBox>Zatím žádné extra tipy.</InfoBox>}
      {data && data.data.length > 0 && (
        <>
          <ExtraTable extras={data.data} onEdit={openEdit} onDelete={handleDelete} />
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
