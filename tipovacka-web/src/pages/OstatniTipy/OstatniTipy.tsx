import { useMemo, useState } from 'react'
import { useSeason } from '../../context/useSeason'
import { useSeasonTips } from '../../api/hooks/useTips'
import { useCurrentUser } from '../../api/hooks/useCurrentUser'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import SeasonSelect from '../../components/SeasonSelect'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'
import type { Tip } from '../../api/types'

interface MatchGroup {
  matchId: number
  homeTeam: string | null
  awayTeam: string | null
  date: string | null
  tips: Tip[]
}

export default function OstatniTipy() {
  const { seasonId } = useSeason()
  const { data: user } = useCurrentUser()
  const { data, isLoading, isError } = useSeasonTips(seasonId)
  const [selectedRound, setSelectedRound] = useState<number | null>(null)

  const tips = useMemo(() => data?.data ?? [], [data])

  const rounds = useMemo(() => {
    const set = new Set(tips.map((t) => t.round).filter((r): r is number => r !== null))
    return [...set].sort((a, b) => a - b)
  }, [tips])

  const round =
    selectedRound !== null && rounds.includes(selectedRound) ? selectedRound : (rounds[rounds.length - 1] ?? null)
  const roundIndex = round !== null ? rounds.indexOf(round) : -1

  const matchGroups = useMemo<MatchGroup[]>(() => {
    const byMatch = new Map<number, MatchGroup>()
    for (const t of tips) {
      if (t.round !== round) continue
      let group = byMatch.get(t.t_zapas)
      if (!group) {
        group = { matchId: t.t_zapas, homeTeam: t.home_team, awayTeam: t.away_team, date: t.date, tips: [] }
        byMatch.set(t.t_zapas, group)
      }
      group.tips.push(t)
    }
    return [...byMatch.values()].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  }, [tips, round])

  return (
    <div>
      <PageHeader
        title="Ostatní tipy"
        subtitle="Jak tipovali ostatní hráči, podle kola"
        action={<SeasonSelect />}
      />

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Tipy se nepodařilo načíst.</InfoBox>}
      {data && rounds.length === 0 && <InfoBox>Zatím žádné tipy v této sezóně.</InfoBox>}

      {data && rounds.length > 0 && round !== null && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedRound(rounds[roundIndex - 1])}
              disabled={roundIndex <= 0}
              aria-label="Předchozí kolo"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-900/5 disabled:opacity-30"
            >
              <IconChevronLeft className="size-4" />
            </button>
            <select
              aria-label="Vyber kolo"
              value={round}
              onChange={(event) => setSelectedRound(Number(event.target.value))}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            >
              {rounds.map((r) => (
                <option key={r} value={r}>
                  Kolo {r}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedRound(rounds[roundIndex + 1])}
              disabled={roundIndex >= rounds.length - 1}
              aria-label="Další kolo"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-900/5 disabled:opacity-30"
            >
              <IconChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {matchGroups.map((group) => (
              <div
                key={group.matchId}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5"
              >
                <div className="flex items-center justify-between bg-brand-50/60 px-5 py-3">
                  <span className="text-sm font-bold text-slate-900">
                    {group.homeTeam} – {group.awayTeam}
                  </span>
                  {group.date && (
                    <span className="text-xs font-medium text-slate-400">{group.date.slice(0, 10)}</span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="px-5 py-2 font-semibold">Hráč</th>
                        <th className="px-5 py-2 font-semibold">Tip</th>
                        <th className="px-5 py-2 font-semibold">Body</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.tips.map((t) => (
                        <tr key={t.t_id} className={t.t_hrac === user?.h_id ? 'bg-brand-50/40' : undefined}>
                          <td className="px-5 py-2.5 font-medium text-slate-900">
                            {t.h_nick ?? '—'}
                            {t.t_hrac === user?.h_id && (
                              <span className="ml-1.5 text-xs font-normal text-brand-600">(ty)</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 tabular-nums text-slate-700">
                            {t.t_tip_d}:{t.t_tip_h}
                          </td>
                          <td className="px-5 py-2.5 tabular-nums text-slate-500">{t.t_body ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
