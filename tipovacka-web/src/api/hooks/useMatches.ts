import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Match, MatchCreateInput, MatchUpdateInput, PaginatedResource } from '../types'

/**
 * GET /matches — stránkovaný seznam (MatchResource). S `seasonId` filtruje
 * na `rocnik` a odpověď obsahuje i `my_tip` (tip přihlášeného hráče), viz
 * MatchController::index — bez něj (admin výpis napříč sezónami) je chování
 * beze změny.
 */
export function useMatches(page: number, seasonId?: number | null) {
  return useQuery({
    queryKey: ['matches', page, seasonId ?? null],
    queryFn: () =>
      apiFetch<PaginatedResource<Match>>(
        `/matches?page=${page}${seasonId ? `&rocnik=${seasonId}` : ''}`,
      ),
    enabled: seasonId === undefined || seasonId !== null,
  })
}

// MatchController::index řadí při filtru na `rocnik` podle z_datum sestupně,
// ne podle kola (viz docs/api-todo.md) — pro řazení "Mých tipů" podle kola se
// proto natáhne celá sezóna v jednom requestu (stejný vzor jako
// useUntippedMatches/useSeasonTips) a seřadí se na frontendu.
const SEASON_MATCHES_PER_PAGE = 500

export function useSeasonMatches(seasonId: number | null) {
  return useQuery({
    queryKey: ['matches', 'season', seasonId],
    queryFn: () =>
      apiFetch<PaginatedResource<Match>>(`/matches?rocnik=${seasonId}&per_page=${SEASON_MATCHES_PER_PAGE}`),
    enabled: seasonId !== null,
  })
}

/** POST /matches — jen admin. */
export function useCreateMatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MatchCreateInput) =>
      apiFetch<{ data: Match }>('/matches', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

/** PUT /matches/{match} — jen admin. */
export function useUpdateMatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MatchUpdateInput }) =>
      apiFetch<{ data: Match }>(`/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
