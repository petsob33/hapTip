import { useMemo, useState } from 'react'
import { useUntippedMatches } from '../../api/hooks/useUntippedMatches'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import UntippedMatchRow from './UntippedMatchRow'
import { IconChevronLeft, IconChevronRight } from '../../components/icons'

export default function Zapasy() {
  const { data, isLoading, isError } = useUntippedMatches()
  const [selectedRound, setSelectedRound] = useState<number | null>(null)

  const rounds = useMemo(() => {
    const set = new Set((data?.data ?? []).map((m) => m.round))
    return [...set].sort((a, b) => a - b)
  }, [data])

  // Vybrané kolo, pokud v aktuálním seznamu ještě existuje, jinak první dostupné —
  // počítáno přímo při renderu, aby nebylo potřeba setState v efektu.
  const round = selectedRound !== null && rounds.includes(selectedRound) ? selectedRound : (rounds[0] ?? null)
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
        title="Zápasy k tipování"
        subtitle={data && data.data.length > 0 ? `${data.data.length} zápasů čeká na tip` : undefined}
      />

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Zápasy se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && (
        <InfoBox>Žádné netipované zápasy — vše je otipováno.</InfoBox>
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
              <UntippedMatchRow key={match.id} match={match} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
