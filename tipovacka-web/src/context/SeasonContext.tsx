import { useMemo, useState, type ReactNode } from 'react'
import { SeasonContext } from './season-context'

const STORAGE_KEY = 'season_id'

function loadInitialSeasonId(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? Number(stored) : null
}

/**
 * Vybraný ročník (rocniky.r_id) napříč celou appkou. Prosté React Context,
 * ne externí state manager — viz CLAUDE.md. Bez výchozí hodnoty: dokud se
 * nenačte GET /rocniky a Layout nezvolí rozumný default, zůstává null.
 */
export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasonId, setSeasonIdState] = useState<number | null>(loadInitialSeasonId)

  function setSeasonId(id: number) {
    setSeasonIdState(id)
    localStorage.setItem(STORAGE_KEY, String(id))
  }

  const value = useMemo(() => ({ seasonId, setSeasonId }), [seasonId])

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}
