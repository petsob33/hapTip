import { createContext } from 'react'

export interface SeasonContextValue {
  seasonId: number | null
  setSeasonId: (id: number) => void
}

export const SeasonContext = createContext<SeasonContextValue | null>(null)
