import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateTip } from '../../api/hooks/useTips'
import { applyFormError } from '../../api/errors'
import { IconTips } from '../../components/icons'
import H2HHistory from './H2HHistory'
import type { Match } from '../../api/types'

interface UntippedMatchRowProps {
  match: Match
}

interface TipFormValues {
  t_tip_d: number
  t_tip_h: number
}

export default function UntippedMatchRow({ match }: UntippedMatchRowProps) {
  const createTip = useCreateTip()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { isSubmitting },
  } = useForm<TipFormValues>()

  async function onSubmit(values: TipFormValues) {
    setError(null)

    try {
      await createTip.mutateAsync({
        t_zapas: match.id,
        t_tip_d: Number(values.t_tip_d),
        t_tip_h: Number(values.t_tip_h),
        // Ročník tipu musí odpovídat ročníku zápasu (match.season = rocniky.r_id),
        // ne globálně vybrané sezóně v sidebaru — GET /untipped nefiltruje podle
        // ročníku, takže seznam může teoreticky obsahovat zápasy z různých sezón.
        t_rocnik: String(match.season),
      })
      setSaved(true)
    } catch (err) {
      const message = applyFormError(err, setFieldError)
      if (message) setError(message)
    }
  }

  if (saved) {
    return (
      <li className="flex items-center gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <IconTips className="size-4" />
        </span>
        <span className="font-semibold">
          {match.home_team} – {match.away_team}
          <span className="ml-2 font-normal text-emerald-600">tip uložen</span>
        </span>
      </li>
    )
  }

  return (
    <li className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          Kolo {match.round}
        </span>
        <span className="text-xs font-medium text-slate-400">{match.date.slice(0, 10)}</span>
      </div>

      <div className="mb-5 flex items-center justify-center gap-3 text-center">
        <span className="flex-1 text-[15px] font-bold text-slate-900">{match.home_team}</span>
        <span className="text-xs font-semibold uppercase text-slate-300">vs</span>
        <span className="flex-1 text-[15px] font-bold text-slate-900">{match.away_team}</span>
      </div>

      <H2HHistory match={match} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center gap-3 sm:flex-row"
        noValidate
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            aria-label="Tip góly domácí"
            className="h-12 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('t_tip_d', { required: true, min: 0 })}
          />
          <span className="text-lg font-bold text-slate-300">:</span>
          <input
            type="number"
            min={0}
            aria-label="Tip góly hosté"
            className="h-12 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('t_tip_h', { required: true, min: 0 })}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-brand-600 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 sm:w-auto sm:flex-1 sm:py-2.5"
        >
          {isSubmitting ? 'Ukládám…' : 'Tipovat'}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </form>
    </li>
  )
}
