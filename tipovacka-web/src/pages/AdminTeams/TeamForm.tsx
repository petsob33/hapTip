import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateTeam } from '../../api/hooks/useTeams'
import { applyFormError } from '../../api/errors'
import type { TeamCreateInput } from '../../api/types'

interface TeamFormProps {
  onCreated: () => void
  onCancel: () => void
}

export default function TeamForm({ onCreated, onCancel }: TeamFormProps) {
  const createTeam = useCreateTeam()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TeamCreateInput>({ defaultValues: { m_platnost: 'A' } })

  async function onSubmit(values: TeamCreateInput) {
    setFormError(null)

    try {
      await createTeam.mutateAsync({ ...values, m_liga: Number(values.m_liga) })
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
      <h2 className="text-sm font-bold text-slate-900">Nový tým</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="m_nazev" className="mb-1.5 block text-sm font-medium text-slate-600">
            Název
          </label>
          <input
            id="m_nazev"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('m_nazev', { required: 'Zadejte název.' })}
          />
          {errors.m_nazev && <p className="mt-1 text-sm text-red-600">{errors.m_nazev.message}</p>}
        </div>

        <div>
          <label htmlFor="m_mesto" className="mb-1.5 block text-sm font-medium text-slate-600">
            Město
          </label>
          <input
            id="m_mesto"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('m_mesto', { required: 'Zadejte město.' })}
          />
          {errors.m_mesto && <p className="mt-1 text-sm text-red-600">{errors.m_mesto.message}</p>}
        </div>

        <div>
          <label htmlFor="m_znak" className="mb-1.5 block text-sm font-medium text-slate-600">
            Znak (URL/název souboru)
          </label>
          <input
            id="m_znak"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('m_znak', { required: 'Zadejte znak.' })}
          />
          {errors.m_znak && <p className="mt-1 text-sm text-red-600">{errors.m_znak.message}</p>}
        </div>

        <div>
          <label htmlFor="m_liga" className="mb-1.5 block text-sm font-medium text-slate-600">
            Liga
          </label>
          <input
            id="m_liga"
            type="number"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('m_liga', { required: 'Zadejte ligu.' })}
          />
          {errors.m_liga && <p className="mt-1 text-sm text-red-600">{errors.m_liga.message}</p>}
        </div>

        <div>
          <label htmlFor="m_platnost" className="mb-1.5 block text-sm font-medium text-slate-600">
            Platnost (A/N)
          </label>
          <select
            id="m_platnost"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            {...register('m_platnost', { required: true })}
          >
            <option value="A">A</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládám…' : 'Vytvořit tým'}
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
