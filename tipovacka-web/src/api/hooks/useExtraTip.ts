import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../client'
import type { ExtraTip, ExtraTipCreateInput, ExtraTipUpdateInput } from '../types'

/**
 * POST /ExtraTip — zadání vlastního tipu na extra otázku. Neinvaliduje zvláštní
 * dotaz na tipy, protože je vidíme přes `my_tip` v GET /extra — stačí
 * invalidovat ['extras'].
 */
export function useCreateExtraTip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ExtraTipCreateInput) =>
      apiFetch<{ data: ExtraTip }>('/ExtraTip', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] })
    },
  })
}

/** PUT /ExtraTip/{id} — úprava vlastního, už zadaného extra tipu. */
export function useUpdateExtraTip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExtraTipUpdateInput }) =>
      apiFetch<{ data: ExtraTip }>(`/ExtraTip/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] })
    },
  })
}
