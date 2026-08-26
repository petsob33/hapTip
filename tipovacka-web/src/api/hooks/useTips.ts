import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { PaginatedResource, Tip, TipCreateInput } from '../types'

/** GET /myTips?player=&year= — tipy konkrétního hráče v daném ročníku (rocniky.r_id). */
export function useMyTips(playerId: number | undefined, seasonId: number | null, page: number) {
  return useQuery({
    queryKey: ['myTips', playerId, seasonId, page],
    queryFn: () =>
      apiFetch<PaginatedResource<Tip>>(
        `/myTips?player=${playerId}&year=${seasonId}&page=${page}`,
      ),
    enabled: playerId !== undefined && seasonId !== null,
  })
}

/** POST /tips — zadání tipu na zápas. */
export function useCreateTip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TipCreateInput) =>
      apiFetch<{ data: Tip }>('/tips', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['untipped'] })
      queryClient.invalidateQueries({ queryKey: ['myTips'] })
    },
  })
}
