import { useQueries } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { LeaderboardResponse, Rocnik } from '../types'

export interface SeasonStanding {
  rocnik: Rocnik
  rank: number
  totalPoints: number | null
  playerCount: number
}

/**
 * Umístění hráče (podle `h_nick`) ve všech ročnících, kde má aspoň jeden
 * obodovaný tip — `/leadboard` vrací jen hráče s tipem v daném ročníku
 * (inner join na `tipy`), takže chybějící nick v odpovědi = ročník bez účasti,
 * ne chyba. API nemá endpoint na "umístění napříč historií", proto se stejný
 * dotaz jako na Žebříčku (`['leaderboard', seasonId]`, sdílená cache s
 * useLeaderboard) volá pro každý ročník z číselníku zvlášť.
 */
export function useMyStandings(nick: string | undefined, rocniky: Rocnik[] | undefined) {
  const results = useQueries({
    queries: (rocniky ?? []).map((r) => ({
      queryKey: ['leaderboard', r.r_id],
      queryFn: () => apiFetch<LeaderboardResponse>(`/leadboard?rocnik=${r.r_id}`),
      enabled: !!nick,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = !rocniky || !nick || results.some((r) => r.isLoading)

  const standings: SeasonStanding[] = []
  if (rocniky && nick) {
    rocniky.forEach((r, i) => {
      const data = results[i]?.data
      if (!data) return
      const index = data.data.findIndex((entry) => entry.h_nick === nick)
      if (index === -1) return
      standings.push({
        rocnik: r,
        rank: index + 1,
        // API vrací SUM() jako číselný string, ne number (viz types.ts) —
        // bez konverze `sum + totalPoints` v Profil.tsx spojuje řetězce.
        totalPoints: data.data[index].total_points === null ? null : Number(data.data[index].total_points),
        playerCount: data.data.length,
      })
    })
  }

  standings.sort((a, b) => b.rocnik.r_id - a.rocnik.r_id)

  return { standings, isLoading }
}
