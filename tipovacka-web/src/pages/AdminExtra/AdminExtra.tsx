import { useState } from 'react'
import { useDeleteExtra, useExtras } from '../../api/hooks/useExtra'
import Pagination from '../../components/Pagination'
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin: Extra tipy</h1>
        {!showForm && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Nový extra tip
          </button>
        )}
      </div>

      {showForm && <ExtraForm initial={editingExtra} onSaved={closeForm} onCancel={closeForm} />}

      {isLoading && <p className="text-sm text-gray-500">Načítání…</p>}
      {isError && <p className="text-sm text-red-600">Extra tipy se nepodařilo načíst.</p>}
      {data && data.data.length === 0 && (
        <p className="text-sm text-gray-500">Zatím žádné extra tipy.</p>
      )}
      {data && data.data.length > 0 && (
        <>
          <ExtraTable extras={data.data} onEdit={openEdit} onDelete={handleDelete} />
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
