import { useForm } from 'react-hook-form'
import { useAllTeams } from '../../api/hooks/useTeams'
import { useCreateMatch } from '../../api/hooks/useMatches'
import { useRocniky } from '../../api/hooks/useRocniky'
import { applyFormError } from '../../api/errors'
import { useSeason } from '../../context/useSeason'
import { useState } from 'react'
import type { MatchCreateInput } from '../../api/types'
import NewRocnikForm from './NewRocnikForm'

interface MatchCreateFormProps {
  onCreated: () => void
  onCancel: () => void
}

export default function MatchCreateForm({ onCreated, onCancel }: MatchCreateFormProps) {
  const { data: teams, isLoading: teamsLoading } = useAllTeams()
  const { data: rocniky, isLoading: rocnikyLoading } = useRocniky()
  const createMatch = useCreateMatch()
  const { seasonId } = useSeason()
  const [formError, setFormError] = useState<string | null>(null)
  const [showNewRocnik, setShowNewRocnik] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MatchCreateInput>({ defaultValues: { z_rocnik: seasonId ?? undefined } })

  async function onRocnikCreated(rocnikId: number) {
    setValue('z_rocnik', rocnikId)
    setShowNewRocnik(false)
  }

  async function onSubmit(values: MatchCreateInput) {
    setFormError(null)

    try {
      await createMatch.mutateAsync({
        ...values,
        z_domaci: Number(values.z_domaci),
        z_hoste: Number(values.z_hoste),
        z_kolo: Number(values.z_kolo),
        z_rocnik: Number(values.z_rocnik),
      })
      onCreated()
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
      <h2 className="text-sm font-bold text-slate-900">Nový zápas</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="z_domaci" className="mb-1.5 block text-sm font-medium text-slate-600">
            Domácí tým
          </label>
          <select
            id="z_domaci"
            disabled={teamsLoading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('z_domaci', { required: 'Vyberte domácí tým.' })}
          >
            <option value="">— vyberte —</option>
            {teams?.map((team) => (
              <option key={team.m_id} value={team.m_id}>
                {team.m_nazev}
              </option>
            ))}
          </select>
          {errors.z_domaci && <p className="mt-1 text-sm text-red-600">{errors.z_domaci.message}</p>}
        </div>

        <div>
          <label htmlFor="z_hoste" className="mb-1.5 block text-sm font-medium text-slate-600">
            Hostující tým
          </label>
          <select
            id="z_hoste"
            disabled={teamsLoading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('z_hoste', { required: 'Vyberte hostující tým.' })}
          >
            <option value="">— vyberte —</option>
            {teams?.map((team) => (
              <option key={team.m_id} value={team.m_id}>
                {team.m_nazev}
              </option>
            ))}
          </select>
          {errors.z_hoste && <p className="mt-1 text-sm text-red-600">{errors.z_hoste.message}</p>}
        </div>

        <div>
          <label htmlFor="z_datum" className="mb-1.5 block text-sm font-medium text-slate-600">
            Datum
          </label>
          <input
            id="z_datum"
            type="date"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('z_datum', { required: 'Zadejte datum.' })}
          />
          {errors.z_datum && <p className="mt-1 text-sm text-red-600">{errors.z_datum.message}</p>}
        </div>

        <div>
          <label htmlFor="z_kolo" className="mb-1.5 block text-sm font-medium text-slate-600">
            Kolo
          </label>
          <input
            id="z_kolo"
            type="number"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('z_kolo', { required: 'Zadejte kolo.' })}
          />
          {errors.z_kolo && <p className="mt-1 text-sm text-red-600">{errors.z_kolo.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="z_rocnik" className="block text-sm font-medium text-slate-600">
              Ročník
            </label>
            <button
              type="button"
              onClick={() => setShowNewRocnik((v) => !v)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {showNewRocnik ? 'Zrušit' : '+ Nový ročník'}
            </button>
          </div>
          <select
            id="z_rocnik"
            disabled={rocnikyLoading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('z_rocnik', { required: 'Vyberte ročník.' })}
          >
            <option value="">— vyberte —</option>
            {rocniky?.map((r) => (
              <option key={r.r_id} value={r.r_id}>
                {r.r_rocnik}
              </option>
            ))}
          </select>
          {errors.z_rocnik && <p className="mt-1 text-sm text-red-600">{errors.z_rocnik.message}</p>}
        </div>
      </div>

      {showNewRocnik && <NewRocnikForm onCreated={onRocnikCreated} onCancel={() => setShowNewRocnik(false)} />}

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládám…' : 'Vytvořit zápas'}
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
