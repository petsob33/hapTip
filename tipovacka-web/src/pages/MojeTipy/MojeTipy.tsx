import { useState } from 'react'
import { useCurrentUser } from '../../api/hooks/useCurrentUser'
import { useMyTips } from '../../api/hooks/useTips'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useSeason } from '../../context/SeasonContext'
import Pagination from '../../components/Pagination'
import type { Tip } from '../../api/types'

function matchLabel(tip: Tip): string {
  return tip.home_team && tip.away_team
    ? `${tip.home_team} – ${tip.away_team}`
    : `Zápas č. ${tip.t_zapas}`
}

function formatDate(date: string | null): string {
  return date ? date.slice(0, 10) : '—'
}

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) {
    return <span className="text-sm text-gray-400">—</span>
  }

  return (
    <span
      className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        points > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {points}
    </span>
  )
}

function InfoBox({ tone, children }: { tone: 'muted' | 'error'; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-lg border border-dashed p-8 text-center text-sm ${
        tone === 'error' ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-500'
      }`}
    >
      {children}
    </div>
  )
}

export default function MojeTipy() {
  const { seasonId } = useSeason()
  const [page, setPage] = useState(1)
  const { data: user } = useCurrentUser()
  const { data: rocniky } = useRocniky()
  const { data, isLoading, isError } = useMyTips(user?.h_id, seasonId, page)

  const seasonLabel = rocniky?.find((r) => r.r_id === seasonId)?.r_rocnik ?? ''

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold text-gray-900">Moje tipy — {seasonLabel}</h1>
        {data && data.meta.total > 0 && (
          <span className="text-sm text-gray-500">{data.meta.total} tipů celkem</span>
        )}
      </div>

      {isLoading && <InfoBox tone="muted">Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Tipy se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && (
        <InfoBox tone="muted">V této sezóně zatím nemáte žádné tipy.</InfoBox>
      )}

      {data && data.data.length > 0 && (
        <>
          {/* Tabulka od sm výšky — na užším viewportu se sloupce (zejména jména
              týmů) nevejdou čitelně vedle sebe, takže tam místo ní jedou karty. */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 sm:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Zápas</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Můj tip</th>
                  <th className="px-4 py-3 font-medium">Body</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((tip) => (
                  <tr key={tip.t_id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{matchLabel(tip)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(tip.date)}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      {tip.t_tip_d} : {tip.t_tip_h}
                    </td>
                    <td className="px-4 py-3">
                      <PointsBadge points={tip.t_body} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 sm:hidden">
            {data.data.map((tip) => (
              <li key={tip.t_id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-gray-900">{matchLabel(tip)}</span>
                  <PointsBadge points={tip.t_body} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(tip.date)}</span>
                  <span className="tabular-nums font-medium text-gray-900">
                    {tip.t_tip_d} : {tip.t_tip_h}
                  </span>
                </div>
              </li>
            ))}
          </ul>

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
