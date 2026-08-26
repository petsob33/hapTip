import { useForm } from 'react-hook-form'
import { useAllTeams } from '../../api/hooks/useTeams'
import { useCreateMatch } from '../../api/hooks/useMatches'
import { useRocniky } from '../../api/hooks/useRocniky'
import { applyFormError } from '../../api/errors'
import { useSeason } from '../../context/SeasonContext'
import { useState } from 'react'
import type { MatchCreateInput } from '../../api/types'

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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MatchCreateInput>({ defaultValues: { z_rocnik: seasonId ?? undefined } })

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
      className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      noValidate
    >
      <h2 className="text-sm font-semibold text-gray-900">Nový zápas</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="z_domaci" className="mb-1 block text-sm text-gray-700">
            Domácí tým
          </label>
          <select
            id="z_domaci"
            disabled={teamsLoading}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
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
          <label htmlFor="z_hoste" className="mb-1 block text-sm text-gray-700">
            Hostující tým
          </label>
          <select
            id="z_hoste"
            disabled={teamsLoading}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
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
          <select
            id="z_rocnik"
            disabled={rocnikyLoading}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
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

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládám…' : 'Vytvořit zápas'}
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
