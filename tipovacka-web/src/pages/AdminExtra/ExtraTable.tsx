import type { Extra } from '../../api/types'

interface ExtraTableProps {
  extras: Extra[]
  onEdit: (extra: Extra) => void
  onDelete: (extra: Extra) => void
}

const typeLabels: Record<Extra['e_typ'], string> = {
  zapas: 'Skóre zápasu',
  muzstvo: 'Vítězné mužstvo',
  volna: 'Volná odpověď',
}

function resultLabel(extra: Extra): string {
  if (extra.e_typ === 'zapas') {
    return extra.e_goly_d !== null && extra.e_goly_h !== null ? `${extra.e_goly_d} : ${extra.e_goly_h}` : '—'
  }
  if (extra.e_typ === 'muzstvo') {
    return extra.e_vysledek_tym?.m_nazev ?? '—'
  }
  return extra.e_vysledek ?? '—'
}

export default function ExtraTable({ extras, onEdit, onDelete }: ExtraTableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
      <table className="w-full text-sm">
        <thead className="bg-brand-50/60">
          <tr className="text-left text-brand-700">
            <th className="px-5 py-3.5 font-semibold">Příloha / otázka</th>
            <th className="px-5 py-3.5 font-semibold">Typ</th>
            <th className="px-5 py-3.5 font-semibold">Výsledek</th>
            <th className="px-5 py-3.5 font-semibold">Ročník</th>
            <th className="px-5 py-3.5 font-semibold">Platnost</th>
            <th className="px-5 py-3.5 font-semibold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {extras.map((extra) => (
            <tr key={extra.e_id} className="transition-colors hover:bg-slate-50">
              <td className="px-5 py-3 font-medium text-slate-900">{extra.e_pril}</td>
              <td className="px-5 py-3 text-slate-500">{typeLabels[extra.e_typ]}</td>
              <td className="px-5 py-3 text-slate-500">{resultLabel(extra)}</td>
              <td className="px-5 py-3 text-slate-500">{extra.e_rocnik}</td>
              <td className="px-5 py-3 text-slate-500">{extra.e_platnost}</td>
              <td className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(extra)}
                  className="mr-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Upravit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(extra)}
                  className="text-sm font-semibold text-red-600 hover:text-red-800"
                >
                  Smazat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
