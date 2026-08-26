import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateExtra, useUpdateExtra } from '../../api/hooks/useExtra'
import { useRocniky } from '../../api/hooks/useRocniky'
import { applyFormError } from '../../api/errors'
import { useSeason } from '../../context/SeasonContext'
import ExtraFormFields from './ExtraFormFields'
import type { AnoNe, Extra, ExtraCreateInput } from '../../api/types'

interface ExtraFormProps {
  initial: Extra | null
  onSaved: () => void
  onCancel: () => void
}

export interface ExtraFormValues {
  e_pril: string
  e_vysledek: string
  e_goly_d: number | ''
  e_goly_h: number | ''
  e_zapas: AnoNe
  e_muzstva: AnoNe
  e_rocnik: number
  e_platnost: AnoNe
  e_datum_pl: string
}

export default function ExtraForm({ initial, onSaved, onCancel }: ExtraFormProps) {
  const createExtra = useCreateExtra()
  const updateExtra = useUpdateExtra()
  const { data: rocniky, isLoading: rocnikyLoading } = useRocniky()
  const { seasonId } = useSeason()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExtraFormValues>({
    defaultValues: {
      e_pril: initial?.e_pril ?? '',
      e_vysledek: initial?.e_vysledek ?? '',
      e_goly_d: initial?.e_goly_d ?? '',
      e_goly_h: initial?.e_goly_h ?? '',
      e_zapas: initial?.e_zapas ?? 'N',
      e_muzstva: initial?.e_muzstva ?? 'N',
      e_rocnik: initial?.e_rocnik ?? seasonId ?? undefined,
      e_platnost: initial?.e_platnost ?? 'A',
      // e_datum_pl je plný ISO timestamp, <input type="date"> čeká "YYYY-MM-DD".
      e_datum_pl: initial?.e_datum_pl ? initial.e_datum_pl.slice(0, 10) : '',
    },
  })

  async function onSubmit(values: ExtraFormValues) {
    setFormError(null)

    const input: ExtraCreateInput = {
      e_pril: values.e_pril,
      e_vysledek: values.e_vysledek || null,
      e_goly_d: values.e_goly_d === '' ? null : Number(values.e_goly_d),
      e_goly_h: values.e_goly_h === '' ? null : Number(values.e_goly_h),
      e_zapas: values.e_zapas,
      e_muzstva: values.e_muzstva,
      e_rocnik: Number(values.e_rocnik),
      e_platnost: values.e_platnost,
      e_datum_pl: values.e_datum_pl || null,
    }

    try {
      if (initial) {
        await updateExtra.mutateAsync({ id: initial.e_id, input })
      } else {
        await createExtra.mutateAsync(input)
      }
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
        {initial ? 'Upravit extra tip' : 'Nový extra tip'}
      </h2>

      <ExtraFormFields
        register={register}
        errors={errors}
        rocniky={rocniky}
        rocnikyLoading={rocnikyLoading}
      />

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
