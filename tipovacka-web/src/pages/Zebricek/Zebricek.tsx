import { useLeaderboard } from '../../api/hooks/useLeaderboard'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useSeason } from '../../context/SeasonContext'

export default function Zebricek() {
  const { seasonId } = useSeason()
  const { data: rocniky } = useRocniky()
  const { data, isLoading, isError } = useLeaderboard(seasonId)

  const seasonLabel = rocniky?.find((r) => r.r_id === seasonId)?.r_rocnik ?? ''

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Žebříček — {seasonLabel}</h1>

      {isLoading && <p className="text-sm text-gray-500">Načítání…</p>}
      {isError && <p className="text-sm text-red-600">Žebříček se nepodařilo načíst.</p>}
      {data && data.data.length === 0 && (
        <p className="text-sm text-gray-500">V této sezóně zatím nejsou žádné body.</p>
      )}
      {data && data.data.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4 font-medium">#</th>
              <th className="py-2 pr-4 font-medium">Hráč</th>
              <th className="py-2 pr-4 font-medium">Body</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((entry, index) => (
              <tr key={entry.h_nick} className="border-b border-gray-100">
                <td className="py-2 pr-4">{index + 1}</td>
                <td className="py-2 pr-4">{entry.h_nick}</td>
                <td className="py-2 pr-4">{entry.total_points ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
