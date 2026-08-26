import { useEffect } from 'react'
import { useRocniky } from '../api/hooks/useRocniky'
import { useSeason } from '../context/SeasonContext'
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
    return <p className="mb-4 px-2 text-xs text-gray-400">Načítání sezón…</p>
  }

  return (
    <div className="mb-4 px-2">
      <label htmlFor="season" className="mb-1 block text-xs font-medium text-gray-500">
        Sezóna
      </label>
      <select
        id="season"
        value={seasonId ?? ''}
        onChange={(event) => setSeasonId(Number(event.target.value))}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
      >
        {rocniky.map((r) => (
          <option key={r.r_id} value={r.r_id}>
            {r.r_rocnik}
          </option>
        ))}
      </select>
    </div>
  )
}
