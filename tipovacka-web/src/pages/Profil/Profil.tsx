import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useCurrentUser } from '../../api/hooks/useCurrentUser'
import { useRecentTips } from '../../api/hooks/useTips'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useMyStandings } from '../../api/hooks/useMyStandings'
import { usePlayerStats } from '../../api/hooks/usePlayerStats'
import { usePlayerH2H } from '../../api/hooks/usePlayerH2H'
import { useLeaderboardHistory } from '../../api/hooks/useLeaderboardHistory'
import { playerPhotoUrl } from '../../api/assets'
import { useSeason } from '../../context/useSeason'
import type { Rocnik } from '../../api/types'
import PageHeader from '../../components/PageHeader'
import InfoBox from '../../components/InfoBox'
import RankBadge from '../../components/RankBadge'
import TipCard from '../../components/TipCard'
import PlayerForm from '../../components/PlayerForm'
import PlayerAccuracy from '../../components/PlayerAccuracy'
import PlayerH2HCard from '../../components/PlayerH2HCard'
import SeasonRankChart from '../../components/SeasonRankChart'
import SeasonSelect from '../../components/SeasonSelect'
import { IconTips, IconTrophy } from '../../components/icons'

/**
 * `rocniky` nemá příznak "domácí liga vs. turnaj" — stejná heuristika jako v
 * `SeasonSelect` (nejčastější `r_liga` v číselníku = domácí soutěž, ME/MS
 * jsou v datech vždy jen pár řádků navíc).
 */
function getMainLigaId(rocniky: Rocnik[]): number | undefined {
  if (rocniky.length === 0) return undefined

  const countsByLiga = new Map<number, number>()
  for (const r of rocniky) {
    countsByLiga.set(r.r_liga, (countsByLiga.get(r.r_liga) ?? 0) + 1)
  }

  return [...countsByLiga.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export default function Profil() {
  // Bez :playerId jde o vlastní profil (zdroj dat je aktuálně přihlášený
  // uživatel). S :playerId jde o profil cizího hráče, kam se odkazuje ze
  // Žebříčku — API nemá endpoint na detail hráče podle ID, takže se jeho
  // přezdívka bere buď z `location.state` (Link ze Žebříčku ji posílá rovnou),
  // nebo — při přímém vstupu na URL bez state — dohledá z prvního načteného
  // tipu (`TipResource` vrací u tipu i `h_nick`).
  const { playerId } = useParams<{ playerId: string }>()
  const location = useLocation()
  const isOwnProfile = playerId === undefined
  const STANDINGS_PAGE_SIZE = 5
  const [standingsShown, setStandingsShown] = useState(STANDINGS_PAGE_SIZE)
  // Fotka je jen z GET /user (jen vlastní profil) a legacy sloupec bez
  // přípony — .jpg je odhad, viz src/api/assets.ts. Bez souboru na serveru
  // (nebo u cizího profilu, kde fotka vůbec není dostupná) zůstanou iniciály.
  const [photoFailed, setPhotoFailed] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const { data: rocniky } = useRocniky()

  const targetPlayerId = isOwnProfile ? currentUser?.h_id : Number(playerId)

  const {
    data: tips,
    isLoading: tipsLoading,
    isError: tipsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecentTips(targetPlayerId)

  const allTips = tips?.pages.flatMap((p) => p.data) ?? []

  const nickFromState = (location.state as { nick?: string } | null)?.nick
  const nick = isOwnProfile ? currentUser?.h_nick : (nickFromState ?? allTips[0]?.h_nick ?? undefined)

  const { standings, isLoading: standingsLoading } = useMyStandings(nick ?? undefined, rocniky)

  const { seasonId } = useSeason()
  const {
    data: playerStats,
    isLoading: playerStatsLoading,
    isError: playerStatsError,
  } = usePlayerStats(targetPlayerId, seasonId)
  const {
    data: h2h,
    isLoading: h2hLoading,
    isError: h2hError,
  } = usePlayerH2H(currentUser?.h_id, isOwnProfile ? undefined : targetPlayerId, seasonId)
  const { history: rankHistory, maxRank } = useLeaderboardHistory(seasonId)

  const displayName = (isOwnProfile ? currentUser?.h_nick || currentUser?.h_jmeno : nick) || '—'
  const initials = displayName.slice(0, 2).toUpperCase()

  const mainLigaId = rocniky ? getMainLigaId(rocniky) : undefined
  const leagueStandings = standings.filter((s) => s.rocnik.r_liga === mainLigaId)
  const podiumCounts = [1, 2, 3].map((rank) => leagueStandings.filter((s) => s.rank === rank).length)
  const bestSeason = leagueStandings.reduce<(typeof leagueStandings)[number] | null>((best, s) => {
    if (s.totalPoints === null) return best
    if (!best || s.totalPoints > (best.totalPoints ?? -Infinity)) return s
    return best
  }, null)
  const seasonsWithPoints = leagueStandings.filter((s) => s.totalPoints !== null)
  const averagePoints =
    seasonsWithPoints.length > 0
      ? seasonsWithPoints.reduce((sum, s) => sum + (s.totalPoints ?? 0), 0) / seasonsWithPoints.length
      : null

  // Domácí ligové sezóny od nejnovější po nejstarší, turnaje (ME/MS) až za nimi
  // (taky od nejnovějšího) — `useMyStandings` sama řadí jen podle r_id sestupně,
  // což by turnaje (r_id 101+) posunulo před aktuální ligovou sezónu.
  const sortedStandings = [...standings].sort((a, b) => {
    const aIsMain = a.rocnik.r_liga === mainLigaId ? 0 : 1
    const bIsMain = b.rocnik.r_liga === mainLigaId ? 0 : 1
    return aIsMain - bIsMain || b.rocnik.r_id - a.rocnik.r_id
  })
  const visibleStandings = sortedStandings.slice(0, standingsShown)

  return (
    <div>
      <PageHeader title="Profil" subtitle={!isOwnProfile ? nick : undefined} />

      {(isOwnProfile ? currentUser : nick) && (
        <div className="mb-6 flex items-center gap-4 rounded-3xl bg-brand-950 p-5 text-white shadow-sm">
          {isOwnProfile && currentUser?.h_foto && !photoFailed ? (
            <img
              src={playerPhotoUrl(currentUser.h_foto)}
              alt={displayName}
              className="h-16 w-16 shrink-0 rounded-2xl bg-white/10 object-cover"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">{displayName}</p>
            {isOwnProfile && currentUser && (
              <>
                <p className="truncate text-sm text-brand-100/70">{currentUser.h_email}</p>
                {currentUser.h_admin === 'A' && (
                  <span className="mt-1.5 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-brand-100">
                    Administrátor
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          <IconTrophy className="size-4" /> Statistiky
        </h2>

        {standingsLoading && <InfoBox>Načítání…</InfoBox>}
        {!standingsLoading && leagueStandings.length === 0 && (
          <InfoBox>Zatím žádná ligová sezóna s obodovaným tipem.</InfoBox>
        )}
        {!standingsLoading && leagueStandings.length > 0 && (
          <>
            <ul className="mb-2.5 grid grid-cols-3 gap-2.5">
              {(['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-700', 'bg-orange-300 text-orange-900'] as const).map(
                (style, i) => (
                  <li
                    key={i}
                    className="flex flex-col items-center gap-1 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${style}`}>
                      {i + 1}.
                    </span>
                    <span className="text-2xl font-extrabold tabular-nums text-slate-900">{podiumCounts[i]}×</span>
                  </li>
                ),
              )}
            </ul>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
                <p className="text-xs text-slate-400">Nejlepší sezóna</p>
                <p className="mt-1 truncate font-bold text-slate-900">{bestSeason?.rocnik.r_rocnik ?? '—'}</p>
                <p className="text-lg font-extrabold tabular-nums text-brand-700">
                  {bestSeason ? `${bestSeason.totalPoints} b` : '—'}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
                <p className="text-xs text-slate-400">Průměr na sezónu</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-brand-700">
                  {averagePoints !== null ? `${averagePoints.toFixed(1)} b` : '—'}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            <IconTrophy className="size-4" /> Forma v sezóně
          </h2>
          <SeasonSelect />
        </div>
        <PlayerForm stats={playerStats} isLoading={playerStatsLoading} isError={playerStatsError} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          <IconTrophy className="size-4" /> Přesnost tipů
        </h2>
        <PlayerAccuracy accuracy={playerStats?.accuracy} isLoading={playerStatsLoading} isError={playerStatsError} />
      </section>

      {nick && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            <IconTrophy className="size-4" /> Vývoj v žebříčku
          </h2>
          <SeasonRankChart data={rankHistory.get(nick) ?? []} maxRank={maxRank} />
        </section>
      )}

      {!isOwnProfile && nick && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            <IconTrophy className="size-4" /> Souboj se mnou
          </h2>
          <PlayerH2HCard
            h2h={h2h}
            isLoading={h2hLoading}
            isError={h2hError}
            myNick={currentUser?.h_nick ?? '—'}
            opponentNick={nick}
          />
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          <IconTrophy className="size-4" /> Historie umístění
        </h2>

        {standingsLoading && <InfoBox>Načítání…</InfoBox>}
        {!standingsLoading && standings.length === 0 && (
          <InfoBox>Zatím žádná sezóna s obodovaným tipem.</InfoBox>
        )}
        {!standingsLoading && standings.length > 0 && (
          <>
            <ul className="flex flex-col gap-2.5">
              {visibleStandings.map((s) => (
                <li
                  key={s.rocnik.r_id}
                  className={`flex items-center gap-3.5 rounded-3xl bg-white p-4 shadow-sm ring-1 ${
                    s.rank <= 3 ? 'ring-brand-200' : 'ring-slate-900/5'
                  }`}
                >
                  <RankBadge rank={s.rank} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{s.rocnik.r_rocnik}</p>
                    <p className="text-xs text-slate-400">z {s.playerCount} hráčů</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums text-brand-700">
                    {s.totalPoints ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
            {sortedStandings.length > standingsShown && (
              <button
                type="button"
                onClick={() => setStandingsShown((n) => n + STANDINGS_PAGE_SIZE)}
                className="mt-3 w-full rounded-full bg-white py-3 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-slate-900/5"
              >
                Zobrazit další
              </button>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
          <IconTips className="size-4" /> Poslední tipy
        </h2>

        {tipsLoading && <InfoBox>Načítání…</InfoBox>}
        {tipsError && <InfoBox tone="error">Tipy se nepodařilo načíst.</InfoBox>}
        {tips && allTips.length === 0 && <InfoBox>Zatím žádné tipy.</InfoBox>}
        {tips && allTips.length > 0 && (
          <>
            <ul className="flex flex-col gap-3">
              {allTips.map((tip) => (
                <TipCard key={tip.t_id} tip={tip} />
              ))}
            </ul>
            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-5 w-full rounded-full bg-white py-3 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-slate-900/5 disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Načítání…' : 'Načíst další'}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
