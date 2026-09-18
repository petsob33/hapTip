import type { PlayerH2HResponse } from '../api/types'
import InfoBox from './InfoBox'

interface PlayerH2HCardProps {
  h2h: PlayerH2HResponse | undefined
  isLoading: boolean
  isError: boolean
  myNick: string
  opponentNick: string
}

/** Souboj přihlášeného hráče s cizím profilem v jedné sezóně, viz usePlayerH2H. */
export default function PlayerH2HCard({ h2h, isLoading, isError, myNick, opponentNick }: PlayerH2HCardProps) {
  if (isLoading) return <InfoBox>Načítání…</InfoBox>
  if (isError) return <InfoBox tone="error">Souboj se nepodařilo načíst.</InfoBox>
  if (!h2h || h2h.matches_compared === 0) {
    return <InfoBox>V této sezóně zatím nemáte společně otipovaný a obodovaný zápas.</InfoBox>
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 flex-1 truncate font-bold text-slate-900">{myNick}</span>
        <span className="shrink-0 text-xs text-slate-400">{h2h.matches_compared} společných zápasů</span>
        <span className="min-w-0 flex-1 truncate text-right font-bold text-slate-900">{opponentNick}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl font-extrabold tabular-nums text-brand-700">{h2h.wins.player1}</span>
        <span className="text-xs font-semibold text-slate-400">{h2h.wins.draws} remíz</span>
        <span className="text-2xl font-extrabold tabular-nums text-brand-700">{h2h.wins.player2}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span>{h2h.total_points.player1} b celkem</span>
        <span>{h2h.total_points.player2} b celkem</span>
      </div>
    </div>
  )
}
