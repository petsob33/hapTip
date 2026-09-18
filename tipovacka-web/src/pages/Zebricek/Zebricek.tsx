import { useLeaderboard } from '../../api/hooks/useLeaderboard'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useTrophyCounts } from '../../api/hooks/useTrophyCounts'
import { useSeasonTips } from '../../api/hooks/useTips'
import { useLeaderboardHistory } from '../../api/hooks/useLeaderboardHistory'
import { useCurrentUser } from '../../api/hooks/useCurrentUser'
import { useSeason } from '../../context/useSeason'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import SeasonSelect from '../../components/SeasonSelect'
import LeaderboardRow from './LeaderboardRow'

export default function Zebricek() {
  const { seasonId } = useSeason()
  const { data: rocniky } = useRocniky()
  const { data, isLoading, isError } = useLeaderboard(seasonId)
  const { podiums } = useTrophyCounts(rocniky)
  const { data: currentUser } = useCurrentUser()
  // API nemá endpoint na detail hráče podle přezdívky ani leadboard s ID hráče
  // (viz docs/api-todo.md) — ID pro odkaz na cizí profil se dohledá z tipů
  // stejné sezóny (leadboard je z nich odvozený přes inner join, takže tam
  // vždy pro každou přezdívku nějaký tip existuje).
  const { data: seasonTips } = useSeasonTips(seasonId)
  const idByNick = new Map((seasonTips?.data ?? []).map((t) => [t.h_nick, t.t_hrac]))
  const { previousRanks, streaks } = useLeaderboardHistory(seasonId)

  const seasonLabel = rocniky?.find((r) => r.r_id === seasonId)?.r_rocnik ?? ''
  // Nejvyšší bodový zisk v aktuální sezóně — může ho sdílet víc hráčů
  // (remíza na 1. místě), ohýnek proto patří každému, kdo mu odpovídá.
  // total_points chodí z API jako číselný string (SQL SUM) — přetypováno
  // přes Number(), jinak by === porovnání níže mohlo minout shodu.
  const topPointsRaw = data?.data[0]?.total_points ?? null
  const topPoints = topPointsRaw === null ? null : Number(topPointsRaw)

  return (
    <div>
      <PageHeader title="Žebříček" subtitle={seasonLabel} action={<SeasonSelect />} />

      {isLoading && <InfoBox>Načítání…</InfoBox>}
      {isError && <InfoBox tone="error">Žebříček se nepodařilo načíst.</InfoBox>}
      {data && data.data.length === 0 && (
        <InfoBox>V této sezóně zatím nejsou žádné body.</InfoBox>
      )}
      {data && data.data.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {data.data.map((entry, index) => {
            const rank = index + 1
            const previousRank = previousRanks?.get(entry.h_nick)
            // Kladné = posun nahoru (byl níž), záporné = posun dolů.
            const delta = previousRank !== undefined ? previousRank - rank : null
            const points = entry.total_points === null ? null : Number(entry.total_points)

            return (
              <li key={entry.h_nick}>
                <LeaderboardRow
                  nick={entry.h_nick}
                  points={points}
                  rank={rank}
                  podium={podiums.get(entry.h_nick)}
                  isMe={entry.h_nick === currentUser?.h_nick}
                  otherId={idByNick.get(entry.h_nick)}
                  delta={delta}
                  leaderStreak={points === topPoints ? (streaks.get(entry.h_nick) ?? 0) : 0}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
