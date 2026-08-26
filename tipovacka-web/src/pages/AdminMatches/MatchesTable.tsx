import type { Match } from '../../api/types'

interface MatchesTableProps {
  matches: Match[]
  onEdit: (match: Match) => void
}

export default function MatchesTable({ matches, onEdit }: MatchesTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="py-2 pr-4 font-medium">Domácí</th>
          <th className="py-2 pr-4 font-medium">Hosté</th>
          <th className="py-2 pr-4 font-medium">Datum</th>
          <th className="py-2 pr-4 font-medium">Kolo</th>
          <th className="py-2 pr-4 font-medium">Skóre</th>
          <th className="py-2 pr-4 font-medium" />
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => (
          <tr key={match.id} className="border-b border-gray-100">
            <td className="py-2 pr-4">{match.home_team ?? '—'}</td>
            <td className="py-2 pr-4">{match.away_team ?? '—'}</td>
            <td className="py-2 pr-4">{match.date}</td>
            <td className="py-2 pr-4">{match.round}</td>
            <td className="py-2 pr-4">
              {match.home_goals ?? '—'} : {match.away_goals ?? '—'}
            </td>
            <td className="py-2 pr-4 text-right">
              <button
                type="button"
                onClick={() => onEdit(match)}
                className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
              >
                Upravit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
