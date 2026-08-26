import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useUpdateMatch } from '../../api/hooks/useMatches'
import { applyFormError } from '../../api/errors'
import type { Match, MatchUpdateInput } from '../../api/types'

interface MatchEditFormProps {
  match: Match
  onSaved: () => void
  onCancel: () => void
}

interface MatchEditFormValues {
  z_datum: string
  z_kolo: number
  z_rocnik: number | ''
  z_goly_d: number | ''
  z_goly_h: number | ''
}

export default function MatchEditForm({ match, onSaved, onCancel }: MatchEditFormProps) {
  const updateMatch = useUpdateMatch()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MatchEditFormValues>({
    defaultValues: {
      // match.date je plný ISO timestamp ("2026-09-15T00:00:00.000000Z"),
      // <input type="date"> ale čeká přesně "YYYY-MM-DD".
      z_datum: match.date.slice(0, 10),
      z_kolo: match.round,
      z_rocnik: match.season ?? '',
      z_goly_d: match.home_goals ?? '',
      z_goly_h: match.away_goals ?? '',
    },
  })

  async function onSubmit(values: MatchEditFormValues) {
    setFormError(null)

    const input: MatchUpdateInput = {
      z_datum: values.z_datum,
      z_kolo: Number(values.z_kolo),
      z_rocnik: values.z_rocnik === '' ? null : Number(values.z_rocnik),
      z_goly_d: values.z_goly_d === '' ? null : Number(values.z_goly_d),
      z_goly_h: values.z_goly_h === '' ? null : Number(values.z_goly_h),
    }

    try {
      await updateMatch.mutateAsync({ id: match.id, input })
      onSaved()
    } catch (error) {
      const message = applyFormError(error, setError)
      if (message) setFormError(message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      noValidate
    >
      <h2 className="text-sm font-semibold text-gray-900">
        Upravit zápas: {match.home_team} – {match.away_team}
      </h2>
      <p className="text-xs text-gray-500">
        Změna týmů zápasu tu není podporovaná — API u seznamu zápasů nevrací ID týmů,
        jen jejich názvy.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="z_datum" className="mb-1 block text-sm text-gray-700">
            Datum
          </label>
          <input
            id="z_datum"
            type="date"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('z_datum', { required: 'Zadejte datum.' })}
          />
          {errors.z_datum && <p className="mt-1 text-sm text-red-600">{errors.z_datum.message}</p>}
        </div>

        <div>
          <label htmlFor="z_kolo" className="mb-1 block text-sm text-gray-700">
            Kolo
          </label>
          <input
            id="z_kolo"
            type="number"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('z_kolo', { required: 'Zadejte kolo.' })}
          />
          {errors.z_kolo && <p className="mt-1 text-sm text-red-600">{errors.z_kolo.message}</p>}
        </div>

        <div>
          <label htmlFor="z_rocnik" className="mb-1 block text-sm text-gray-700">
            Ročník
          </label>
          <input
            id="z_rocnik"
            type="number"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('z_rocnik')}
          />
        </div>

        <div />

        <div>
          <label htmlFor="z_goly_d" className="mb-1 block text-sm text-gray-700">
            Góly domácí
          </label>
          <input
            id="z_goly_d"
            type="number"
            min={0}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('z_goly_d')}
          />
        </div>

        <div>
          <label htmlFor="z_goly_h" className="mb-1 block text-sm text-gray-700">
            Góly hosté
          </label>
          <input
            id="z_goly_h"
            type="number"
            min={0}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('z_goly_h')}
          />
        </div>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládám…' : 'Uložit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}
