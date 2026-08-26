import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Extra, ExtraCreateInput, ExtraUpdateInput, Paginated } from '../types'

/** GET /extra — stránkovaný seznam (syrový model). */
export function useExtras(page: number) {
  return useQuery({
    queryKey: ['extras', page],
    queryFn: () => apiFetch<Paginated<Extra>>(`/extra?page=${page}`),
  })
}

/** POST /extra — jen admin. */
export function useCreateExtra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ExtraCreateInput) =>
      apiFetch<Extra>('/extra', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] })
    },
  })
}

/** PUT /extra/{extra} — jen admin. */
export function useUpdateExtra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExtraUpdateInput }) =>
      apiFetch<Extra>(`/extra/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] })
    },
  })
}

/** DELETE /extra/{extra} — jen admin. */
export function useDeleteExtra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => apiFetch<{ message: string }>(`/extra/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] })
    },
  })
}
