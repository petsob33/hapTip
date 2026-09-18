import type { PlayerStats } from '../api/types'
import InfoBox from './InfoBox'

interface PlayerFormProps {
  stats: PlayerStats | undefined
  isLoading: boolean
  isError: boolean
}

/** Průměr bodů na kolo a forma (body v posledních kolech) v jedné sezóně, viz usePlayerStats. */
export default function PlayerForm({ stats, isLoading, isError }: PlayerFormProps) {
  if (isLoading) return <InfoBox>Načítání…</InfoBox>
  if (isError) return <InfoBox tone="error">Formu se nepodařilo načíst.</InfoBox>
  if (!stats || stats.rounds_played === 0) {
    return <InfoBox>V této sezóně zatím žádné obodované kolo.</InfoBox>
  }

  const maxPoints = Math.max(1, ...stats.form.map((r) => r.points))

  return (
    <>
      <div className="mb-2.5 grid grid-cols-2 gap-2.5">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-xs text-slate-400">Průměr na kolo</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-brand-700">
            {stats.avg_points_per_round !== null ? `${stats.avg_points_per_round} b` : '—'}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
          <p className="text-xs text-slate-400">Odehraná kola</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-brand-700">{stats.rounds_played}</p>
        </div>
      </div>
      <div className="flex items-end gap-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
        {stats.form.map((r) => (
          <div key={r.round} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-bold tabular-nums text-slate-500">{r.points}</span>
            <div
              className="w-full rounded-t-md bg-brand-500"
              style={{ height: `${Math.max(8, (r.points / maxPoints) * 64)}px` }}
            />
            <span className="text-[10px] text-slate-400">{r.round}.</span>
          </div>
        ))}
      </div>
    </>
  )
}
