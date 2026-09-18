import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useCreateRocnik } from '../../api/hooks/useRocniky'
import { applyFormError } from '../../api/errors'
import type { RocnikCreateInput } from '../../api/types'

interface NewRocnikFormProps {
  onCreated: (rocnikId: number) => void
  onCancel: () => void
}

/** Mini formulář pro založení ročníku, vnořený do MatchCreateForm — kde jinak
 * uživatel narazí na to, že nová sezóna v selectu chybí. */
export default function NewRocnikForm({ onCreated, onCancel }: NewRocnikFormProps) {
  const createRocnik = useCreateRocnik()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RocnikCreateInput>({ defaultValues: { r_liga: 1 } })

  async function onSubmit(values: RocnikCreateInput) {
    setFormError(null)

    try {
      const rocnik = await createRocnik.mutateAsync({ ...values, r_liga: Number(values.r_liga) })
      onCreated(rocnik.r_id)
    } catch (error) {
      const message = applyFormError(error, setError)
      if (message) setFormError(message)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-900">Nový ročník</h3>
      {/* Vnořeno uvnitř MatchCreateForm, kde HTML nepovoluje další <form> —
          proto <div> + tlačítko volající handleSubmit ručně, ne type="submit". */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="r_rocnik" className="mb-1.5 block text-sm font-medium text-slate-600">
              Název (např. 2026-27)
            </label>
            <input
              id="r_rocnik"
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('r_rocnik', { required: 'Zadejte název ročníku.' })}
            />
            {errors.r_rocnik && <p className="mt-1 text-sm text-red-600">{errors.r_rocnik.message}</p>}
          </div>

          <div>
            <label htmlFor="r_liga" className="mb-1.5 block text-sm font-medium text-slate-600">
              Liga
            </label>
            <input
              id="r_liga"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('r_liga', { required: 'Zadejte ligu.' })}
            />
            {errors.r_liga && <p className="mt-1 text-sm text-red-600">{errors.r_liga.message}</p>}
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Zakládám…' : 'Založit ročník'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  )
}
