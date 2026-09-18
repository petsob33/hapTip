import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateTip, useUpdateTip } from '../../api/hooks/useTips'
import { applyFormError } from '../../api/errors'
import { TipPointsBadge } from '../../components/TipCard'
import type { Match } from '../../api/types'

interface MyTipRowProps {
  match: Match
}

interface TipFormValues {
  t_tip_d: number
  t_tip_h: number
}

/** Skutečný výsledek zápasu, nebo "—", pokud se ještě neodehrál. */
function resultLabel(match: Match): string {
  if (match.home_goals === null || match.away_goals === null) {
    return '—'
  }
  return `${match.home_goals} : ${match.away_goals}`
}

function todayDateOnly(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Řádek jednoho zápasu sezóny — reálný výsledek, a vlastní tip, který lze zadat i upravit. */
export default function MyTipRow({ match }: MyTipRowProps) {
  const tip = match.my_tip
  // Tip lze upravovat jen do dne předem — v den zápasu (a po něm) se uzamkne,
  // bez ohledu na to, jestli už má admin zadaný výsledek.
  const isLocked = match.date.slice(0, 10) <= todayDateOnly()
  const createTip = useCreateTip()
  const updateTip = useUpdateTip()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { isSubmitting },
  } = useForm<TipFormValues>({
    defaultValues: { t_tip_d: tip?.t_tip_d, t_tip_h: tip?.t_tip_h },
  })

  async function onSubmit(values: TipFormValues) {
    setError(null)
    const input = { t_tip_d: Number(values.t_tip_d), t_tip_h: Number(values.t_tip_h) }

    try {
      if (tip) {
        await updateTip.mutateAsync({ id: tip.t_id, input })
      } else {
        await createTip.mutateAsync({
          t_zapas: match.id,
          ...input,
          t_rocnik: String(match.season),
        })
      }
    } catch (err) {
      const message = applyFormError(err, setFieldError)
      if (message) setError(message)
    }
  }

  return (
    <li className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          Kolo {match.round}
        </span>
        <span className="text-xs font-medium text-slate-400">{match.date.slice(0, 10)}</span>
      </div>

      <div className="mb-4 flex items-center justify-center gap-3 text-center">
        <span className="flex-1 text-[15px] font-bold text-slate-900">{match.home_team}</span>
        <span className="tabular-nums text-base font-extrabold text-slate-900">
          {resultLabel(match)}
        </span>
        <span className="flex-1 text-[15px] font-bold text-slate-900">{match.away_team}</span>
      </div>

      {isLocked ? (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase text-slate-400">Můj tip</span>
          <span className="tabular-nums text-base font-bold text-slate-900">
            {tip ? `${tip.t_tip_d} : ${tip.t_tip_h}` : '—'}
          </span>
          <span className="ml-auto">
            <TipPointsBadge points={tip?.t_body ?? null} />
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center gap-3 sm:flex-row"
          noValidate
        >
          <span className="text-xs font-semibold uppercase text-slate-400">Můj tip</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              aria-label="Tip góly domácí"
              className="h-11 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('t_tip_d', { required: true, min: 0 })}
            />
            <span className="text-base font-bold text-slate-300">:</span>
            <input
              type="number"
              min={0}
              aria-label="Tip góly hosté"
              className="h-11 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('t_tip_h', { required: true, min: 0 })}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 sm:w-auto sm:px-5"
          >
            {isSubmitting ? 'Ukládám…' : tip ? 'Upravit' : 'Tipovat'}
          </button>
          <span className="sm:ml-auto">
            <TipPointsBadge points={tip?.t_body ?? null} />
          </span>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </form>
      )}
    </li>
  )
}
