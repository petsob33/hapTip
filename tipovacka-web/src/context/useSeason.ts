import { useContext } from 'react'
import { SeasonContext, type SeasonContextValue } from './season-context'

export function useSeason(): SeasonContextValue {
  const context = useContext(SeasonContext)
  if (!context) {
    throw new Error('useSeason musí být použit uvnitř <SeasonProvider>.')
  }
  return context
}
