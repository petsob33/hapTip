import type { Match } from '../../api/types'

interface MatchesTableProps {
  matches: Match[]
  onEdit: (match: Match) => void
}

export default function MatchesTable({ matches, onEdit }: MatchesTableProps) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
      <table className="w-full text-sm">
        <thead className="bg-brand-50/60">
          <tr className="text-left text-brand-700">
            <th className="px-5 py-3.5 font-semibold">Domácí</th>
            <th className="px-5 py-3.5 font-semibold">Hosté</th>
            <th className="px-5 py-3.5 font-semibold">Datum</th>
            <th className="px-5 py-3.5 font-semibold">Kolo</th>
            <th className="px-5 py-3.5 font-semibold">Skóre</th>
            <th className="px-5 py-3.5 font-semibold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {matches.map((match) => (
            <tr key={match.id} className="transition-colors hover:bg-slate-50">
              <td className="px-5 py-3 font-medium text-slate-900">{match.home_team ?? '—'}</td>
              <td className="px-5 py-3 font-medium text-slate-900">{match.away_team ?? '—'}</td>
              <td className="px-5 py-3 text-slate-500">{match.date}</td>
              <td className="px-5 py-3 text-slate-500">{match.round}</td>
              <td className="px-5 py-3 tabular-nums text-slate-900">
                {match.home_goals ?? '—'} : {match.away_goals ?? '—'}
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(match)}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Upravit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
