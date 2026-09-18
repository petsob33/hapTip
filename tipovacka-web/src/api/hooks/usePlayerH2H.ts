import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { PlayerH2HResponse } from '../types'

/**
 * GET /players/h2h?player1=&player2=&rocnik= — souboj dvou hráčů v dané
 * sezóně. Nezaměňovat s useH2H (vzájemné zápasy dvou týmů).
 */
export function usePlayerH2H(player1: number | undefined, player2: number | undefined, seasonId: number | null) {
  return useQuery({
    queryKey: ['playerH2H', player1, player2, seasonId],
    queryFn: () => apiFetch<PlayerH2HResponse>(`/players/h2h?player1=${player1}&player2=${player2}&rocnik=${seasonId}`),
    enabled: player1 !== undefined && player2 !== undefined && player1 !== player2 && seasonId !== null,
  })
}
