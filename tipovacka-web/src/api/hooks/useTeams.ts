import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Paginated, Team, TeamCreateInput } from '../types'

/** GET /team — stránkovaný seznam (syrový model). */
export function useTeams(page: number) {
  return useQuery({
    queryKey: ['teams', page],
    queryFn: () => apiFetch<Paginated<Team>>(`/team?page=${page}`),
  })
}

/**
 * Všechny týmy najednou (pro výběr domácí/hosté v MatchForm). GET /team
 * nemá parametr pro vypnutí stránkování ani hledání, takže se natáhnou
 * všechny stránky — při desítkách týmů je to v pohodě, při řádově
 * stovkách by to chtělo řešit jinak (hledání na backendu).
 */
export function useAllTeams() {
  return useQuery({
    queryKey: ['teams', 'all'],
    queryFn: async () => {
      const first = await apiFetch<Paginated<Team>>('/team?page=1')
      const rest = await Promise.all(
        Array.from({ length: first.last_page - 1 }, (_, i) =>
          apiFetch<Paginated<Team>>(`/team?page=${i + 2}`),
        ),
      )
      return [first, ...rest].flatMap((page) => page.data)
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** POST /team. */
export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TeamCreateInput) =>
      apiFetch<Team>('/team', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}
