import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { Rocnik } from '../types'

/** GET /rocniky — číselník ročníků/sezón, bez stránkování (~40 řádků). */
export function useRocniky() {
  return useQuery({
    queryKey: ['rocniky'],
    queryFn: () => apiFetch<Rocnik[]>('/rocniky'),
    staleTime: 60 * 60 * 1000,
  })
}
