import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type {
  ManualResultsImportPreview,
  ResultsImportApplyResult,
  ResultsImportPreview,
} from '../types'

/**
 * GET /matches/import-results/preview — jen admin. Jako mutace, ne query:
 * spouští se na kliknutí ("Načíst výsledky"), ne automaticky při vstupu na
 * stránku, a nic nezapisuje.
 */
export function useResultsImportPreview() {
  return useMutation({
    mutationFn: (rocnik: number) =>
      apiFetch<ResultsImportPreview>(`/matches/import-results/preview?rocnik=${rocnik}`),
  })
}

/** POST /matches/import-results/apply — jen admin. */
export function useResultsImportApply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ rocnik, matchIds }: { rocnik: number; matchIds: number[] }) =>
      apiFetch<ResultsImportApplyResult>('/matches/import-results/apply', {
        method: 'POST',
        body: JSON.stringify({ rocnik, match_ids: matchIds }),
      }),
    onSuccess: () => {
      // Aplikace výsledků přepočítá body u dotčených tipů (TipScoringService),
      // takže kromě zápasů musí zneplatnit i vše, co z bodů vychází.
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['tips'] })
      queryClient.invalidateQueries({ queryKey: ['myTips'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['playerStats'] })
    },
  })
}

/**
 * POST /matches/import-results/manual-preview — jen admin. Bez volání
 * externího API: admin vloží výsledky jako text, viz ManualResultsImport.
 */
export function useManualResultsImportPreview() {
  return useMutation({
    mutationFn: ({ rocnik, text }: { rocnik: number; text: string }) =>
      apiFetch<ManualResultsImportPreview>('/matches/import-results/manual-preview', {
        method: 'POST',
        body: JSON.stringify({ rocnik, text }),
      }),
  })
}

/** POST /matches/import-results/manual-apply — jen admin. */
export function useManualResultsImportApply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ rocnik, text, matchIds }: { rocnik: number; text: string; matchIds: number[] }) =>
      apiFetch<ResultsImportApplyResult>('/matches/import-results/manual-apply', {
        method: 'POST',
        body: JSON.stringify({ rocnik, text, match_ids: matchIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['tips'] })
      queryClient.invalidateQueries({ queryKey: ['myTips'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['playerStats'] })
    },
  })
}
