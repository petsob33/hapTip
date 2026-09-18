import { useLeagueTable } from '../../api/hooks/useLeagueTable'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useAllTeams } from '../../api/hooks/useTeams'
import { useSeason } from '../../context/useSeason'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import SeasonSelect from '../../components/SeasonSelect'
import TeamCrest from '../../components/TeamCrest'

export default function Tabulka() {
  const { seasonId } = useSeason()
  const { data: rocniky } = useRocniky()
  const { table, isLoading, isError } = useLeagueTable(seasonId)
  // LeagueTableRow zná tým jen podle jména (MatchResource nevrací ID týmů,
  // viz docs/api-todo.md) — znak se dohledá podle jména z GET /team.
  const { data: teams } = useAllTeams()
  const znakByName = new Map((teams ?? []).map((t) => [t.m_nazev, t.m_znak]))

  const seasonLabel = rocniky?.find((r) => r.r_id === seasonId)?.r_rocnik ?? ''

  return (
    <div>
      <PageHeader title="Tabulka ligy" subtitle={seasonLabel} action={<SeasonSelect />} />

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Tabulku se nepodařilo načíst.</InfoBox>}
      {!isLoading && !isError && table.length === 0 && (
        <InfoBox>V této sezóně zatím nejsou žádné odehrané zápasy.</InfoBox>
      )}

      {table.length > 0 && (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2.5 font-semibold sm:px-5">#</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-5">Tým</th>
                  <th className="px-2 py-2.5 text-center font-semibold" title="Zápasy">
                    Z
                  </th>
                  <th className="px-2 py-2.5 text-center font-semibold" title="Výhry">
                    V
                  </th>
                  <th className="px-2 py-2.5 text-center font-semibold" title="Remízy">
                    R
                  </th>
                  <th className="px-2 py-2.5 text-center font-semibold" title="Prohry">
                    P
                  </th>
                  <th className="px-2 py-2.5 text-center font-semibold" title="Skóre">
                    Skóre
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold sm:px-5" title="Body">
                    B
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.map((row, index) => {
                  const rank = index + 1
                  const goalDiff = row.goalsFor - row.goalsAgainst
                  return (
                    <tr key={row.team} className={rank <= 3 ? 'bg-brand-50/40' : undefined}>
                      <td className="px-3 py-2.5 font-semibold text-slate-400 tabular-nums sm:px-5">{rank}.</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <TeamCrest m_znak={znakByName.get(row.team)} name={row.team} />
                          <span className="truncate">{row.team}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-slate-600">{row.played}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-slate-600">{row.won}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-slate-600">{row.drawn}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-slate-600">{row.lost}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-slate-500">
                        {row.goalsFor}:{row.goalsAgainst}
                        <span className={`ml-1 ${goalDiff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          ({goalDiff >= 0 ? '+' : ''}
                          {goalDiff})
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-base font-extrabold tabular-nums text-brand-700 sm:px-5">
                        {row.points}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
