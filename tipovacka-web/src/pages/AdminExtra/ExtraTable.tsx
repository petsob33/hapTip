import type { Extra } from '../../api/types'

interface ExtraTableProps {
  extras: Extra[]
  onEdit: (extra: Extra) => void
  onDelete: (extra: Extra) => void
}

export default function ExtraTable({ extras, onEdit, onDelete }: ExtraTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="py-2 pr-4 font-medium">Příloha / otázka</th>
          <th className="py-2 pr-4 font-medium">Výsledek</th>
          <th className="py-2 pr-4 font-medium">Ročník</th>
          <th className="py-2 pr-4 font-medium">Platnost</th>
          <th className="py-2 pr-4 font-medium" />
        </tr>
      </thead>
      <tbody>
        {extras.map((extra) => (
          <tr key={extra.e_id} className="border-b border-gray-100">
            <td className="py-2 pr-4">{extra.e_pril}</td>
            <td className="py-2 pr-4">{extra.e_vysledek ?? '—'}</td>
            <td className="py-2 pr-4">{extra.e_rocnik}</td>
            <td className="py-2 pr-4">{extra.e_platnost}</td>
            <td className="py-2 pr-4 text-right">
              <button
                type="button"
                onClick={() => onEdit(extra)}
                className="mr-3 text-sm font-medium text-gray-700 underline hover:text-gray-900"
              >
                Upravit
              </button>
              <button
                type="button"
                onClick={() => onDelete(extra)}
                className="text-sm font-medium text-red-600 underline hover:text-red-800"
              >
                Smazat
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
