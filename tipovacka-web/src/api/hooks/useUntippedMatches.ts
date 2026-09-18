import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Match, PaginatedResource } from '../types'

// Netipovaných zápasů je vždy jen pár kol dopředu — jedna stránka s vysokým
// per_page je bezpečně pokryje a umožní je na frontendu seskupit podle kola.
const PER_PAGE = 200

/** GET /untipped — nadcházející zápasy, které přihlášený hráč ještě netipoval, řazené podle kola. */
export function useUntippedMatches() {
  return useQuery({
    queryKey: ['untipped'],
    queryFn: () => apiFetch<PaginatedResource<Match>>(`/untipped?per_page=${PER_PAGE}`),
  })
}
