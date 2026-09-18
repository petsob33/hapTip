import type { PlayerAccuracy as PlayerAccuracyData } from '../api/types'
import InfoBox from './InfoBox'

interface PlayerAccuracyProps {
  accuracy: PlayerAccuracyData | undefined
  isLoading: boolean
  isError: boolean
}

const SEGMENTS = [
  { key: 'exact', label: 'Přesný tip', color: 'bg-emerald-600' },
  { key: 'outcome', label: 'Trefený výsledek', color: 'bg-brand-500' },
  { key: 'miss', label: 'Mimo', color: 'bg-slate-300' },
] as const

/** Rozklad obodovaných tipů na přesné/trefené/mimo, viz usePlayerStats (`accuracy`). */
export default function PlayerAccuracy({ accuracy, isLoading, isError }: PlayerAccuracyProps) {
  if (isLoading) return <InfoBox>Načítání…</InfoBox>
  if (isError) return <InfoBox tone="error">Přesnost se nepodařilo načíst.</InfoBox>
  if (!accuracy || accuracy.tips_scored === 0) {
    return <InfoBox>V této sezóně zatím žádný obodovaný tip.</InfoBox>
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
      <p className="mb-2 text-xs text-slate-400">Z {accuracy.tips_scored} obodovaných tipů</p>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {SEGMENTS.map(({ key, color }) => {
          const count = accuracy[key]
          if (count === 0) return null
          return (
            <div
              key={key}
              className={color}
              style={{ width: `${(count / accuracy.tips_scored) * 100}%` }}
            />
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {SEGMENTS.map(({ key, label, color }) => {
          const count = accuracy[key]
          const pct = accuracy[`${key}_pct`]
          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
              {label}: <span className="font-semibold tabular-nums text-slate-700">{count}</span>
              {pct !== null && <span className="tabular-nums text-slate-400">({pct}%)</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}
