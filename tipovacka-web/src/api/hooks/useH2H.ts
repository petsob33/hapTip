import { useMemo } from 'react'
import { useSeasonMatches } from './useMatches'
import type { H2HMatch, Match } from '../types'

const H2H_LIMIT = 5

/**
 * Historie vzájemných zápasů (H2H) dvou týmů tipovaného zápasu — API na to
 * nemá dedikovaný endpoint (viz docs/api-todo.md), počítá se z
 * `GET /matches?rocnik=` (sdílená cache s Mými tipy / Tabulkou ligy):
 * odehrané zápasy stejné sezóny mezi stejnou dvojicí týmů (v obou pořadích
 * domácí/hosté), od nejnovějšího, max `H2H_LIMIT`.
 */
export function useH2H(match: Match) {
  const { data, isLoading, isError } = useSeasonMatches(match.season)

  const history = useMemo<H2HMatch[]>(() => {
    if (!match.home_team || !match.away_team) return []
    const pair = new Set([match.home_team, match.away_team])

    return (data?.data ?? [])
      .filter(
        (m): m is Match & { home_team: string; away_team: string; home_goals: number; away_goals: number } =>
          m.id !== match.id &&
          m.home_goals !== null &&
          m.away_goals !== null &&
          m.home_team !== null &&
          m.away_team !== null &&
          pair.has(m.home_team) &&
          pair.has(m.away_team),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, H2H_LIMIT)
      .map((m) => ({
        id: m.id,
        date: m.date,
        home_team: m.home_team,
        away_team: m.away_team,
        home_goals: m.home_goals,
        away_goals: m.away_goals,
        season: m.season,
      }))
  }, [data, match])

  return { data: history, isLoading, isError }
}
