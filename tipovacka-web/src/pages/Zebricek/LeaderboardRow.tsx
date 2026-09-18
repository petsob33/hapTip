import { Link } from 'react-router-dom'
import RankBadge from '../../components/RankBadge'
import { IconChevronDown, IconChevronUp, IconFlame, IconTrophy } from '../../components/icons'
import type { PodiumCounts } from '../../api/hooks/useTrophyCounts'
import { pluralKolo } from './pluralKolo'

function PodiumIcons({ count, className, title }: { count: number; className: string; title: string }) {
  if (count <= 0) return null
  return (
    <span className={`flex shrink-0 items-center gap-0.5 ${className}`} title={title}>
      <IconTrophy className="size-3.5" />
      <span className="text-xs font-bold">{count}</span>
    </span>
  )
}

export default function LeaderboardRow({
  nick,
  points,
  rank,
  podium,
  isMe,
  otherId,
  delta,
  leaderStreak,
}: {
  nick: string
  points: number | null
  rank: number
  podium: PodiumCounts | undefined
  isMe: boolean
  otherId: number | undefined
  delta: number | null
  leaderStreak: number
}) {
  const rowClassName = `flex items-center gap-3.5 rounded-3xl bg-white p-4 shadow-sm ring-1 transition-shadow hover:shadow-md ${
    rank <= 3 ? 'ring-brand-200' : 'ring-slate-900/5'
  }`

  const content = (
    <>
      <RankBadge rank={rank} />
      {delta !== null && delta !== 0 && (
        <span
          className={`flex items-center gap-0.5 text-xs font-bold ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}
          title={`${delta > 0 ? 'Posun nahoru' : 'Posun dolů'} o ${Math.abs(delta)} od minulého kola`}
        >
          {delta > 0 ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />}
          {Math.abs(delta)}
        </span>
      )}
      {delta === 0 && (
        <span className="text-xs font-semibold text-slate-300" title="Beze změny od minulého kola">
          –
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-bold text-slate-900">{nick}</span>
        <PodiumIcons count={podium?.first ?? 0} className="text-amber-500" title={`${podium?.first}× 1. místo v ročníku`} />
        <PodiumIcons count={podium?.second ?? 0} className="text-slate-400" title={`${podium?.second}× 2. místo v ročníku`} />
        <PodiumIcons count={podium?.third ?? 0} className="text-orange-500" title={`${podium?.third}× 3. místo v ročníku`} />
      </span>
      {leaderStreak > 0 && (
        <span
          className="flex shrink-0 items-center gap-1 text-orange-500"
          title={`Drží se na 1. místě ${leaderStreak} ${pluralKolo(leaderStreak)} v řadě`}
        >
          <IconFlame className="size-6" />
          <span className="text-base font-extrabold">{leaderStreak}</span>
        </span>
      )}
      <span className="text-lg font-extrabold tabular-nums text-brand-700">{points ?? '—'}</span>
    </>
  )

  if (isMe) {
    return (
      <Link to="/profil" className={rowClassName}>
        {content}
      </Link>
    )
  }

  if (otherId !== undefined) {
    return (
      <Link to={`/profil/${otherId}`} state={{ nick }} className={rowClassName}>
        {content}
      </Link>
    )
  }

  return <div className={rowClassName}>{content}</div>
}
