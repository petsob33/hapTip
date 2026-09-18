import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Extra, ExtraCreateInput, ExtraUpdateInput, PaginatedResource } from '../types'

/** GET /extra — stránkovaný seznam, volitelně filtrovaný na ročník. */
export function useExtras(page: number, rocnik?: number | null) {
  return useQuery({
    queryKey: ['extras', page, rocnik ?? 'all'],
    queryFn: () =>
      apiFetch<PaginatedResource<Extra>>(
        rocnik != null ? `/extra?page=${page}&rocnik=${rocnik}` : `/extra?page=${page}`,
      ),
  })
}

/** POST /extra — jen admin. */
export function useCreateExtra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ExtraCreateInput) =>
      apiFetch<{ data: Extra }>('/extra', {
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
      apiFetch<{ data: Extra }>(`/extra/${id}`, {
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
