import { useQuery } from '@tanstack/react-query'
import { apiFetch, getToken } from '../client'
import type { User } from '../types'

/** GET /user — aktuálně přihlášený hráč (mj. h_admin pro rozhodnutí o admin UI). */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiFetch<User>('/user'),
    enabled: !!getToken(),
    staleTime: 5 * 60 * 1000,
  })
}
