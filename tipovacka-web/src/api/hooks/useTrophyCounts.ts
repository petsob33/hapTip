import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { PodiumsResponse, Rocnik } from '../types'

export interface PodiumCounts {
  first: number
  second: number
  third: number
}

/**
 * Počet umístění na 1.–3. místě každého hráče (podle h_nick) napříč všemi
 * ročníky — GET /leadboard/podiums počítá umístění pro všechny ročníky
 * najednou na backendu, takže tu stačí jeden request (dřív se volalo
 * /leadboard zvlášť pro každý ročník z číselníku).
 */
export function useTrophyCounts(rocniky: Rocnik[] | undefined) {
  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['leaderboard-podiums'],
    queryFn: () => apiFetch<PodiumsResponse>('/leadboard/podiums'),
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = !rocniky || queryLoading

  const podiums = new Map<string, PodiumCounts>()
  ;(data?.data ?? []).forEach((entry) => {
    podiums.set(entry.h_nick, {
      first: Number(entry.first),
      second: Number(entry.second),
      third: Number(entry.third),
    })
  })

  return { podiums, isLoading }
}
