import type { RoundRank } from '../api/hooks/useLeaderboardHistory'
import InfoBox from './InfoBox'

const WIDTH = 600
const HEIGHT = 140
const PADDING_X = 12
const PADDING_Y = 10

/** Vývoj pořadí hráče napříč koly vybrané sezóny — nahoře = lepší umístění (1. místo). */
export default function SeasonRankChart({ data, maxRank }: { data: RoundRank[]; maxRank: number }) {
  if (data.length === 0) {
    return <InfoBox>V této sezóně zatím žádné obodované kolo.</InfoBox>
  }

  if (data.length === 1) {
    return (
      <div className="rounded-3xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-900/5">
        Po 1. kole je na {data[0].rank}. místě.
      </div>
    )
  }

  const denom = Math.max(maxRank - 1, 1)
  const innerWidth = WIDTH - PADDING_X * 2
  const innerHeight = HEIGHT - PADDING_Y * 2

  const toXY = (rank: number, index: number) => {
    const x = PADDING_X + (index / (data.length - 1)) * innerWidth
    const y = PADDING_Y + ((rank - 1) / denom) * innerHeight
    return [x, y] as const
  }

  const points = data.map((d, i) => toXY(d.rank, i).join(',')).join(' ')
  // Max ~8 popisků kola, aby se na malé šířce nepřekrývaly.
  const labelStep = Math.max(1, Math.ceil(data.length / 8))

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 16}`} className="w-full text-brand-400" aria-hidden="true">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const [x, y] = toXY(d.rank, i)
          return (
            <circle
              key={d.round}
              cx={x}
              cy={y}
              r={d.rank === 1 ? 3.5 : 2.5}
              className={d.rank === 1 ? 'fill-amber-500' : 'fill-brand-600'}
            />
          )
        })}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null
          const [x] = toXY(d.rank, i)
          return (
            <text key={`label-${d.round}`} x={x} y={HEIGHT + 12} textAnchor="middle" className="fill-slate-400 text-[10px]">
              {d.round}.
            </text>
          )
        })}
      </svg>
    </div>
  )
}
