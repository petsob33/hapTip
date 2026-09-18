import { useMemo, useState } from 'react'
import { useSeasonMatches } from '../../api/hooks/useMatches'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useSeason } from '../../context/useSeason'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import SeasonSelect from '../../components/SeasonSelect'
import MyTipRow from './MyTipRow'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'

export default function MojeTipy() {
  const { seasonId } = useSeason()
  const { data: rocniky } = useRocniky()
  const { data, isLoading, isError } = useSeasonMatches(seasonId)
  const [selectedRound, setSelectedRound] = useState<number | null>(null)

  const seasonLabel = rocniky?.find((r) => r.r_id === seasonId)?.r_rocnik ?? ''

  // Stejný vzor jako Zápasy k tipování — proklikávání kol šipkami, ne
  // stránkování po zápasech. API samo řadí `/matches?rocnik=` jen podle data,
  // viz docs/api-todo.md.
  const rounds = useMemo(() => {
    const set = new Set((data?.data ?? []).map((m) => m.round))
    return [...set].sort((a, b) => a - b)
  }, [data])

  // Poslední kolo s aspoň jedním vyhodnoceným zápasem (má zadaný výsledek) —
  // na rozdíl od Zápasů k tipování tu jde hlavně o kontrolu už otipovaného,
  // ne o nejbližší nadcházející kolo.
  const lastEvaluatedRound = useMemo(() => {
    const evaluatedRounds = (data?.data ?? [])
      .filter((m) => m.home_goals !== null && m.away_goals !== null)
      .map((m) => m.round)
    return evaluatedRounds.length > 0 ? Math.max(...evaluatedRounds) : null
  }, [data])

  // Vybrané kolo, pokud v aktuálním seznamu ještě existuje, jinak poslední
  // vyhodnocené (nebo první dostupné, pokud sezóna ještě nemá výsledky) —
  // počítáno přímo při renderu, aby nebylo potřeba setState v efektu.
  const round =
    selectedRound !== null && rounds.includes(selectedRound)
      ? selectedRound
      : (lastEvaluatedRound ?? rounds[0] ?? null)
  const roundIndex = round !== null ? rounds.indexOf(round) : -1
  const matches = useMemo(
    () =>
      (data?.data ?? [])
        .filter((m) => m.round === round)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [data, round],
  )

  return (
    <div>
      <PageHeader
        title="Moje tipy"
        subtitle={seasonLabel}
        action={
          <div className="flex items-center gap-2">
            <SeasonSelect />
            {data && data.data.length > 0 && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {data.data.length} zápasů
              </span>
            )}
          </div>
        }
      />

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Zápasy se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && (
        <InfoBox>V této sezóně zatím nejsou žádné zápasy.</InfoBox>
      )}

      {data && data.data.length > 0 && round !== null && (
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
          <ul className="flex flex-col gap-3">
            {matches.map((match) => (
              <MyTipRow key={match.id} match={match} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
