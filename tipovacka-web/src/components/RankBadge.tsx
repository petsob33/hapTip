const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-400 text-amber-950',
  2: 'bg-slate-300 text-slate-700',
  3: 'bg-orange-300 text-orange-900',
}

/** Kulatý odznak s pořadím — zlatá/stříbrná/bronzová pro první tři místa. */
export default function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank] ?? 'bg-slate-100 text-slate-500'
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${style}`}
    >
      {rank}
    </span>
  )
}
