import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { PaginatedResource, Tip, TipCreateInput, TipUpdateInput } from '../types'

/**
 * GET /myTips?player=&page= (bez `year`) — nejnovější tipy hráče napříč všemi
 * ročníky, řazené sestupně podle data (viz docs/api.md — `year` je nepovinný).
 * `per_page` je pevných 10 (`paginate(10)` na backendu), Profil na to spoléhá
 * pro "posledních 10 sázek" + tlačítko "Načíst další".
 */
export function useRecentTips(playerId: number | undefined) {
  return useInfiniteQuery({
    queryKey: ['myTips', playerId, 'all'],
    queryFn: ({ pageParam }) =>
      apiFetch<PaginatedResource<Tip>>(`/myTips?player=${playerId}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined,
    enabled: playerId !== undefined,
  })
}

/**
 * GET /tips?rocnik=&per_page= — tipy všech hráčů v sezóně (bez omezení na
 * přihlášeného uživatele), pro seskupení podle kola na obrazovce "Ostatní tipy".
 * per_page je vysoký, aby přišla celá sezóna v jednom requestu (viz useUntippedMatches).
 */
const SEASON_TIPS_PER_PAGE = 500

export function useSeasonTips(seasonId: number | null) {
  return useQuery({
    queryKey: ['tips', 'season', seasonId],
    queryFn: () => apiFetch<PaginatedResource<Tip>>(`/tips?rocnik=${seasonId}&per_page=${SEASON_TIPS_PER_PAGE}`),
    enabled: seasonId !== null,
  })
}

/**
 * GET /tips?rocnik= — VŠECHNY tipy sezóny, stránkuje se dokud API nedojde
 * (`meta.last_page`). Na rozdíl od `useSeasonTips` (per_page=500, "celá
 * sezóna v jednom requestu") tohle pro opravdu velké sezóny nefunguje —
 * `t_rocnik` s desítkami kol snadno přeleze 500 řádků (viz r_id 33, "2025-26",
 * 2683 tipů), takže by ořízlo nejstarší kola. Použij jen tam, kde na
 * kompletnosti napříč celou sezónou záleží (`useLeaderboardHistory`), ne
 * všude — víc requestů na jedno otevření stránky.
 */
async function fetchAllSeasonTips(seasonId: number): Promise<Tip[]> {
  const perPage = 500
  const all: Tip[] = []
  let page = 1

  while (true) {
    const res = await apiFetch<PaginatedResource<Tip>>(
      `/tips?rocnik=${seasonId}&per_page=${perPage}&page=${page}`,
    )
    all.push(...res.data)
    if (page >= res.meta.last_page) break
    page++
  }

  return all
}

export function useFullSeasonTips(seasonId: number | null) {
  return useQuery({
    queryKey: ['tips', 'season', 'full', seasonId],
    queryFn: () => fetchAllSeasonTips(seasonId as number),
    enabled: seasonId !== null,
  })
}

/** POST /tips — zadání tipu na zápas. */
export function useCreateTip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TipCreateInput) =>
      apiFetch<{ data: Tip }>('/tips', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['untipped'] })
      queryClient.invalidateQueries({ queryKey: ['myTips'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

/** PUT /tips/{id} — úprava vlastního, už zadaného tipu. */
export function useUpdateTip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TipUpdateInput }) =>
      apiFetch<{ data: Tip }>(`/tips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTips'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}
