import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './client'

/**
 * Zpracuje chybu z apiFetch po odeslání formuláře: 422 chyby namapuje na
 * jednotlivá pole přes react-hook-form setError, jinak vrátí obecnou
 * hlášku k zobrazení nad/pod formulářem.
 */
export function applyFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string | null {
  if (error instanceof ApiError && error.status === 422) {
    const fieldErrors = error.body?.errors ?? {}
    let mapped = false

    for (const [field, messages] of Object.entries(fieldErrors)) {
      setError(field as Path<T>, { message: messages[0] })
      mapped = true
    }

    if (mapped) {
      return null
    }

    return error.body?.message ?? 'Požadavek se nepodařilo zpracovat.'
  }

  return 'Něco se pokazilo. Zkuste to prosím znovu.'
}
