import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateExtra, useUpdateExtra } from '../../api/hooks/useExtra'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useAllTeams } from '../../api/hooks/useTeams'
import { applyFormError } from '../../api/errors'
import { useSeason } from '../../context/useSeason'
import ExtraFormFields from './ExtraFormFields'
import type { AnoNe, Extra, ExtraCreateInput, ExtraType } from '../../api/types'

interface ExtraFormProps {
  initial: Extra | null
  onSaved: () => void
  onCancel: () => void
}

export interface ExtraFormValues {
  e_pril: string
  e_typ: ExtraType
  e_goly_d: number | ''
  e_goly_h: number | ''
  e_vysledek_tym: number | ''
  e_vysledek_text: string
  e_rocnik: number
  e_platnost: AnoNe
  e_datum_pl: string
}

export default function ExtraForm({ initial, onSaved, onCancel }: ExtraFormProps) {
  const createExtra = useCreateExtra()
  const updateExtra = useUpdateExtra()
  const { data: rocniky, isLoading: rocnikyLoading } = useRocniky()
  const { data: teams, isLoading: teamsLoading } = useAllTeams()
  const { seasonId } = useSeason()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    watch,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExtraFormValues>({
    defaultValues: {
      e_pril: initial?.e_pril ?? '',
      e_typ: initial?.e_typ ?? 'zapas',
      e_goly_d: initial?.e_goly_d ?? '',
      e_goly_h: initial?.e_goly_h ?? '',
      e_vysledek_tym: initial?.e_vysledek_tym?.m_id ?? '',
      e_vysledek_text: initial?.e_typ === 'volna' ? initial.e_vysledek ?? '' : '',
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
      e_typ: values.e_typ,
      e_goly_d: values.e_typ === 'zapas' && values.e_goly_d !== '' ? Number(values.e_goly_d) : null,
      e_goly_h: values.e_typ === 'zapas' && values.e_goly_h !== '' ? Number(values.e_goly_h) : null,
      e_vysledek_tym:
        values.e_typ === 'muzstvo' && values.e_vysledek_tym !== '' ? Number(values.e_vysledek_tym) : null,
      e_vysledek_text: values.e_typ === 'volna' ? values.e_vysledek_text || null : null,
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
      className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5"
      noValidate
    >
      <h2 className="text-sm font-bold text-slate-900">
        {initial ? 'Upravit extra tip' : 'Nový extra tip'}
      </h2>

      <ExtraFormFields
        register={register}
        watch={watch}
        errors={errors}
        rocniky={rocniky}
        rocnikyLoading={rocnikyLoading}
        teams={teams}
        teamsLoading={teamsLoading}
      />

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládám…' : 'Uložit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}
