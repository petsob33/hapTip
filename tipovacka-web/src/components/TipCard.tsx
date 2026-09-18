import type { Tip } from '../api/types'

function tipMatchLabel(tip: Tip): string {
  return tip.home_team && tip.away_team
    ? `${tip.home_team} – ${tip.away_team}`
    : `Zápas č. ${tip.t_zapas}`
}

function formatTipDate(date: string | null): string {
  return date ? date.slice(0, 10) : '—'
}

export function TipPointsBadge({ points }: { points: number | null }) {
  if (points === null) {
    return <span className="text-sm text-slate-300">—</span>
  }

  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
        points > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
      }`}
    >
      {points} b
    </span>
  )
}

/** Karta jednoho tipu — sdílená mezi Moje tipy (mobil) a Profil (poslední tipy). */
export default function TipCard({ tip }: { tip: Tip }) {
  return (
    <li className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-bold text-slate-900">{tipMatchLabel(tip)}</span>
        <TipPointsBadge points={tip.t_body} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-slate-400">{formatTipDate(tip.date)}</span>
        <span className="tabular-nums text-base font-bold text-slate-900">
          {tip.t_tip_d} : {tip.t_tip_h}
        </span>
      </div>
    </li>
  )
}
