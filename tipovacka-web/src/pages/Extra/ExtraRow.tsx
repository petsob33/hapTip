import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateExtraTip, useUpdateExtraTip } from '../../api/hooks/useExtraTip'
import { useAllTeams } from '../../api/hooks/useTeams'
import { applyFormError } from '../../api/errors'
import { TipPointsBadge } from '../../components/TipCard'
import type { Extra } from '../../api/types'

interface ExtraRowProps {
  extra: Extra
}

interface ExtraTipFormValues {
  ex_tip_d: number | ''
  ex_tip_h: number | ''
  ex_tip_tym: number | ''
  ex_tip_text: string
}

function hasResult(extra: Extra): boolean {
  if (extra.e_typ === 'zapas') {
    return extra.e_goly_d !== null && extra.e_goly_h !== null
  }
  return extra.e_vysledek !== null && extra.e_vysledek !== ''
}

function resultLabel(extra: Extra): string {
  if (extra.e_typ === 'zapas') {
    return `${extra.e_goly_d} : ${extra.e_goly_h}`
  }
  if (extra.e_typ === 'muzstvo') {
    return extra.e_vysledek_tym?.m_nazev ?? '—'
  }
  return extra.e_vysledek ?? '—'
}

function myTipLabel(extra: Extra): string {
  const tip = extra.my_tip
  if (!tip) return '—'
  if (extra.e_typ === 'zapas') return `${tip.ex_tip_d} : ${tip.ex_tip_h}`
  if (extra.e_typ === 'muzstvo') return tip.ex_tip_tym?.m_nazev ?? '—'
  return tip.ex_tip ?? '—'
}

/** Řádek jedné extra otázky — po vyhodnocení jen na čtení, do té doby formulář pro zadání/úpravu tipu. */
export default function ExtraRow({ extra }: ExtraRowProps) {
  const tip = extra.my_tip
  const { data: teams, isLoading: teamsLoading } = useAllTeams()
  const createExtraTip = useCreateExtraTip()
  const updateExtraTip = useUpdateExtraTip()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { isSubmitting },
  } = useForm<ExtraTipFormValues>({
    defaultValues: {
      ex_tip_d: tip?.ex_tip_d ?? '',
      ex_tip_h: tip?.ex_tip_h ?? '',
      ex_tip_tym: tip?.ex_tip_tym?.m_id ?? '',
      ex_tip_text: tip?.ex_tip ?? '',
    },
  })

  async function onSubmit(values: ExtraTipFormValues) {
    setError(null)

    const fields = {
      ex_tip_d: extra.e_typ === 'zapas' && values.ex_tip_d !== '' ? Number(values.ex_tip_d) : null,
      ex_tip_h: extra.e_typ === 'zapas' && values.ex_tip_h !== '' ? Number(values.ex_tip_h) : null,
      ex_tip_tym: extra.e_typ === 'muzstvo' && values.ex_tip_tym !== '' ? Number(values.ex_tip_tym) : null,
      ex_tip_text: extra.e_typ === 'volna' ? values.ex_tip_text : null,
    }

    try {
      if (tip) {
        await updateExtraTip.mutateAsync({ id: tip.ex_id, input: fields })
      } else {
        await createExtraTip.mutateAsync({
          ex_extra: extra.e_id,
          ex_rocnik: extra.e_rocnik,
          ...fields,
        })
      }
    } catch (err) {
      const message = applyFormError(err, setFieldError)
      if (message) setError(message)
    }
  }

  const resolved = hasResult(extra)

  return (
    <li className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="font-bold text-slate-900">{extra.e_pril}</span>
        {resolved && <TipPointsBadge points={tip?.ex_body ?? null} />}
      </div>

      {resolved ? (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">
            Výsledek: <span className="font-semibold text-slate-700">{resultLabel(extra)}</span>
          </span>
          <span className="text-slate-400">
            Tvůj tip: <span className="font-semibold text-slate-700">{myTipLabel(extra)}</span>
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          noValidate
        >
          {extra.e_typ === 'zapas' && (
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                min={0}
                aria-label="Tip góly domácí"
                className="h-11 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                {...register('ex_tip_d', { required: true, min: 0 })}
              />
              <span className="text-base font-bold text-slate-300">:</span>
              <input
                type="number"
                min={0}
                aria-label="Tip góly hosté"
                className="h-11 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                {...register('ex_tip_h', { required: true, min: 0 })}
              />
            </div>
          )}

          {extra.e_typ === 'muzstvo' && (
            <select
              aria-label="Tip mužstvo"
              disabled={teamsLoading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:flex-1"
              {...register('ex_tip_tym', { required: true })}
            >
              <option value="">— vyberte —</option>
              {teams?.map((team) => (
                <option key={team.m_id} value={team.m_id}>
                  {team.m_nazev}
                </option>
              ))}
            </select>
          )}

          {extra.e_typ === 'volna' && (
            <input
              type="text"
              maxLength={250}
              aria-label="Tip"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:flex-1"
              {...register('ex_tip_text', { required: true })}
            />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 sm:w-auto sm:px-5"
          >
            {isSubmitting ? 'Ukládám…' : tip ? 'Upravit' : 'Tipovat'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </form>
      )}
    </li>
  )
}
