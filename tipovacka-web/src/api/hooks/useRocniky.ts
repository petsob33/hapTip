import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Rocnik, RocnikCreateInput } from '../types'

/** GET /rocniky — číselník ročníků/sezón, bez stránkování (~40 řádků). */
export function useRocniky() {
  return useQuery({
    queryKey: ['rocniky'],
    queryFn: () => apiFetch<Rocnik[]>('/rocniky'),
    staleTime: 60 * 60 * 1000,
  })
}

/** POST /rocniky (admin) — založení nového ročníku/sezóny. */
export function useCreateRocnik() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RocnikCreateInput) =>
      apiFetch<Rocnik>('/rocniky', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocniky'] })
    },
  })
}
