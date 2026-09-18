import { useMemo } from 'react'
import { useFullSeasonTips } from './useTips'

/** Pořadí podle bodů (sestupně, ties = pořadí ve vstupu) — stejná logika jako řazení v Zebricek.tsx. */
function rankByPoints(totals: Map<string, number>): Map<string, number> {
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const ranks = new Map<string, number>()
  sorted.forEach(([nick], index) => ranks.set(nick, index + 1))
  return ranks
}

export interface RoundRank {
  round: number
  rank: number
}

/**
 * Vývoj pořadí hráčů napříč koly sezóny — pro porovnání s minulým kolem
 * (šipka v žebříčku), graf vývoje pořadí na profilu hráče a "kolik kol v
 * řadě drží 1. místo". API nemá endpoint na historické pořadí podle kola
 * (viz docs/api-todo.md), proto se počítá z `GET /tips?rocnik=` (sdílená
 * cache s Ostatní tipy), který u každého tipu nese i kolo zápasu (`round`)
 * a body (`t_body`).
 *
 * Hráč, který nemá žádný obodovaný tip v daném kole, v tom kole v historii
 * chybí (ne 0 bodů) — graf tak kreslí jen kola, kde hráč reálně měl co počítat.
 *
 * Používá `useFullSeasonTips` (stránkuje celou sezónu), ne `useSeasonTips`
 * (per_page=500) — u sezón s desítkami kol by 500 řádků ořízlo nejstarší
 * kola a totály/streak by nesedely na skutečný žebříček (viz useTips.ts).
 */
export function useLeaderboardHistory(seasonId: number | null) {
  const { data: seasonTips, isLoading } = useFullSeasonTips(seasonId)

  return useMemo(() => {
    const tips = seasonTips ?? []
    const scored = tips.filter(
      (t): t is typeof t & { round: number; t_body: number; h_nick: string } =>
        t.t_body !== null && t.round !== null && t.h_nick !== null,
    )

    if (scored.length === 0) {
      return { previousRanks: null, history: new Map<string, RoundRank[]>(), streaks: new Map<string, number>(), maxRank: 0, isLoading }
    }

    const rounds = [...new Set(scored.map((t) => t.round))].sort((a, b) => a - b)

    const running = new Map<string, number>()
    const rankByRound = new Map<number, Map<string, number>>()
    const totalsByRound = new Map<number, Map<string, number>>()

    for (const round of rounds) {
      for (const t of scored) {
        if (t.round !== round) continue
        running.set(t.h_nick, (running.get(t.h_nick) ?? 0) + t.t_body)
      }
      rankByRound.set(round, rankByPoints(running))
      totalsByRound.set(round, new Map(running))
    }

    const previousRound = rounds.length > 1 ? rounds[rounds.length - 2] : null
    const previousRanks = previousRound !== null ? (rankByRound.get(previousRound) ?? null) : null

    const history = new Map<string, RoundRank[]>()
    let maxRank = 0
    for (const round of rounds) {
      const ranks = rankByRound.get(round)!
      maxRank = Math.max(maxRank, ranks.size)
      for (const [nick, rank] of ranks) {
        if (!history.has(nick)) history.set(nick, [])
        history.get(nick)!.push({ round, rank })
      }
    }

    // Streak = počet po sobě jdoucích kol odzadu, kde hráč (společně) vedl
    // s nejvyšším součtem bodů. Remíza na 1. místě se počítá pro OBA hráče —
    // "držet 1. místo" neznamená být jediný nahoře, jen ne níž než nejlepší.
    const streaks = new Map<string, number>()
    for (const nick of running.keys()) {
      let streak = 0
      for (let i = rounds.length - 1; i >= 0; i--) {
        const totals = totalsByRound.get(rounds[i])!
        const playerTotal = totals.get(nick)
        if (playerTotal === undefined) break
        const maxTotal = Math.max(...totals.values())
        if (playerTotal !== maxTotal) break
        streak++
      }
      streaks.set(nick, streak)
    }

    return { previousRanks, history, streaks, maxRank, isLoading }
  }, [seasonTips, isLoading])
}
