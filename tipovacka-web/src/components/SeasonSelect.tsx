import { useEffect } from 'react'
import { useRocniky } from '../api/hooks/useRocniky'
import { useSeason } from '../context/useSeason'
import type { Rocnik } from '../api/types'

/**
 * rocniky nemá příznak "aktuální ročník". Jako rozumný výchozí odhad bereme
 * nejvyšší r_id z nejčastěji zastoupené ligy v číselníku — to v praxi
 * odpovídá aktuální domácí sezóně (těch je v datech vždy nejvíc, jedna za
 * rok), na rozdíl od řídce zastoupených turnajů (ME/MS).
 */
function pickDefaultRocnik(rocniky: Rocnik[]): Rocnik | undefined {
  if (rocniky.length === 0) return undefined

  const countsByLiga = new Map<number, number>()
  for (const r of rocniky) {
    countsByLiga.set(r.r_liga, (countsByLiga.get(r.r_liga) ?? 0) + 1)
  }

  const [mainLiga] = [...countsByLiga.entries()].sort((a, b) => b[1] - a[1])[0]

  return rocniky
    .filter((r) => r.r_liga === mainLiga)
    .sort((a, b) => b.r_id - a.r_id)[0]
}

/** Kompaktní pilulka pro umístění v akční části PageHeaderu, vedle titulku. */
export default function SeasonSelect() {
  const { data: rocniky, isLoading } = useRocniky()
  const { seasonId, setSeasonId } = useSeason()

  useEffect(() => {
    if (seasonId === null && rocniky && rocniky.length > 0) {
      const fallback = pickDefaultRocnik(rocniky)
      if (fallback) setSeasonId(fallback.r_id)
    }
  }, [seasonId, rocniky, setSeasonId])

  if (isLoading || !rocniky) {
    return <span className="text-xs text-slate-400">Načítání sezón…</span>
  }

  return (
    <select
      id="season"
      aria-label="Sezóna"
      value={seasonId ?? ''}
      onChange={(event) => setSeasonId(Number(event.target.value))}
      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
    >
      {rocniky.map((r) => (
        <option key={r.r_id} value={r.r_id} className="text-slate-900">
          {r.r_rocnik}
        </option>
      ))}
    </select>
  )
}
