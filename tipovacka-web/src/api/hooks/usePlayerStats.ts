import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { PlayerStats } from '../types'

/** GET /players/{player}/stats?rocnik= — forma a průměr bodů na kolo v dané sezóně. */
export function usePlayerStats(playerId: number | undefined, seasonId: number | null) {
  return useQuery({
    queryKey: ['playerStats', playerId, seasonId],
    queryFn: () => apiFetch<PlayerStats>(`/players/${playerId}/stats?rocnik=${seasonId}`),
    enabled: playerId !== undefined && seasonId !== null,
  })
}
