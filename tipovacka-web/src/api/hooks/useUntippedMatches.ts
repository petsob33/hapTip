import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Match, PaginatedResource } from '../types'

/** GET /untipped — nadcházející zápasy, které přihlášený hráč ještě netipoval. */
export function useUntippedMatches(page: number) {
  return useQuery({
    queryKey: ['untipped', page],
    queryFn: () => apiFetch<PaginatedResource<Match>>(`/untipped?page=${page}`),
  })
}
