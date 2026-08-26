import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Match, MatchCreateInput, MatchUpdateInput, PaginatedResource } from '../types'

/** GET /matches — stránkovaný seznam (MatchResource). */
export function useMatches(page: number) {
  return useQuery({
    queryKey: ['matches', page],
    queryFn: () => apiFetch<PaginatedResource<Match>>(`/matches?page=${page}`),
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
