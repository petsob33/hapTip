import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateTip } from '../../api/hooks/useTips'
import { applyFormError } from '../../api/errors'
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
      <li className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <span>
          {match.home_team} – {match.away_team}
        </span>
        <span>Tip uložen ✓</span>
      </li>
    )
  }

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">
          {match.home_team} – {match.away_team}
        </span>
        <span className="text-gray-500">
          {match.date.slice(0, 10)} · kolo {match.round}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2" noValidate>
        <input
          type="number"
          min={0}
          aria-label="Tip góly domácí"
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
          {...register('t_tip_d', { required: true, min: 0 })}
        />
        <span className="text-gray-500">:</span>
        <input
          type="number"
          min={0}
          aria-label="Tip góly hosté"
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
          {...register('t_tip_h', { required: true, min: 0 })}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-2 rounded bg-gray-900 px-3 py-1 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládám…' : 'Tipovat'}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </form>
    </li>
  )
}
