import { useMemo } from 'react'
import { useSeasonMatches } from './useMatches'

export interface LeagueTableRow {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

/**
 * Tabulka ligy (pořadí týmů podle odehraných zápasů) — API na to nemá
 * endpoint, počítá se z `GET /matches?rocnik=` (sdílená cache s
 * useSeasonMatches z Mých tipů). Řazeno podle bodů, pak rozdílu skóre, pak
 * vstřelených branek, pak abecedně.
 */
export function useLeagueTable(seasonId: number | null) {
  const { data, isLoading, isError } = useSeasonMatches(seasonId)

  const table = useMemo<LeagueTableRow[]>(() => {
    const rows = new Map<string, LeagueTableRow>()

    function getRow(team: string): LeagueTableRow {
      let row = rows.get(team)
      if (!row) {
        row = { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
        rows.set(team, row)
      }
      return row
    }

    for (const m of data?.data ?? []) {
      if (!m.home_team || !m.away_team || m.home_goals === null || m.away_goals === null) continue

      const home = getRow(m.home_team)
      const away = getRow(m.away_team)

      home.played += 1
      away.played += 1
      home.goalsFor += m.home_goals
      home.goalsAgainst += m.away_goals
      away.goalsFor += m.away_goals
      away.goalsAgainst += m.home_goals

      if (m.home_goals > m.away_goals) {
        home.won += 1
        away.lost += 1
        home.points += 3
      } else if (m.home_goals < m.away_goals) {
        away.won += 1
        home.lost += 1
        away.points += 3
      } else {
        home.drawn += 1
        away.drawn += 1
        home.points += 1
        away.points += 1
      }
    }

    return [...rows.values()].sort(
      (a, b) =>
        b.points - a.points ||
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor ||
        a.team.localeCompare(b.team),
    )
  }, [data])

  return { table, isLoading, isError }
}
