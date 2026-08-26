import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { LeaderboardResponse } from '../types'

/** GET /leadboard?rocnik= — pořadí hráčů podle bodů v daném ročníku (rocniky.r_id). */
export function useLeaderboard(seasonId: number | null) {
  return useQuery({
    queryKey: ['leaderboard', seasonId],
    queryFn: () => apiFetch<LeaderboardResponse>(`/leadboard?rocnik=${seasonId}`),
    enabled: seasonId !== null,
  })
}
