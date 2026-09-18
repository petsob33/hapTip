import { useH2H } from '../../api/hooks/useH2H'
import type { H2HMatch, Match } from '../../api/types'

interface H2HHistoryProps {
  match: Match
}

/** Zelená pro vítěze, tlumená pro poraženého, obě neutrální při remíze. */
function teamClassName(isWinner: boolean, isDraw: boolean): string {
  if (isDraw) return 'text-slate-500'
  return isWinner ? 'font-bold text-emerald-600' : 'text-slate-400'
}

function scoreClassName(h2h: H2HMatch): string {
  if (h2h.home_goals === h2h.away_goals) return 'bg-slate-200 text-slate-600'
  return 'bg-emerald-100 text-emerald-700'
}

/** Vzájemná bilance obou týmů v tipovaném zápase. Bez historie se nic nezobrazí. */
export default function H2HHistory({ match }: H2HHistoryProps) {
  const { data, isLoading } = useH2H(match)

  if (isLoading || !data || data.length === 0) return null

  return (
    <div className="mb-5 rounded-2xl bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Vzájemné zápasy
      </p>
      <ul className="flex flex-col gap-1.5">
        {data.map((h2h) => {
          const isDraw = h2h.home_goals === h2h.away_goals
          const homeWon = h2h.home_goals > h2h.away_goals
          return (
            <li key={h2h.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate">
                <span className={teamClassName(homeWon, isDraw)}>{h2h.home_team}</span>
                <span className="text-slate-300"> – </span>
                <span className={teamClassName(!homeWon, isDraw)}>{h2h.away_team}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-bold tabular-nums ${scoreClassName(h2h)}`}>
                {h2h.home_goals}:{h2h.away_goals}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
