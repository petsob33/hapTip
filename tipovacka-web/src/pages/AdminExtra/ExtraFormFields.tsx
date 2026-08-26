import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { ExtraFormValues } from './ExtraForm'
import type { Rocnik } from '../../api/types'

interface ExtraFormFieldsProps {
  register: UseFormRegister<ExtraFormValues>
  errors: FieldErrors<ExtraFormValues>
  rocniky: Rocnik[] | undefined
  rocnikyLoading: boolean
}

export default function ExtraFormFields({
  register,
  errors,
  rocniky,
  rocnikyLoading,
}: ExtraFormFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="e_pril" className="mb-1 block text-sm text-gray-700">
          Příloha / otázka
        </label>
        <input
          id="e_pril"
          type="text"
          maxLength={250}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          {...register('e_pril', { required: 'Zadejte text.' })}
        />
        {errors.e_pril && <p className="mt-1 text-sm text-red-600">{errors.e_pril.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="e_vysledek" className="mb-1 block text-sm text-gray-700">
            Výsledek (nepovinné)
          </label>
          <input
            id="e_vysledek"
            type="text"
            maxLength={250}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_vysledek')}
          />
        </div>

        <div />

        <div>
          <label htmlFor="e_goly_d" className="mb-1 block text-sm text-gray-700">
            Góly domácí (nepovinné)
          </label>
          <input
            id="e_goly_d"
            type="number"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_goly_d')}
          />
        </div>

        <div>
          <label htmlFor="e_goly_h" className="mb-1 block text-sm text-gray-700">
            Góly hosté (nepovinné)
          </label>
          <input
            id="e_goly_h"
            type="number"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_goly_h')}
          />
        </div>

        <div>
          <label htmlFor="e_zapas" className="mb-1 block text-sm text-gray-700">
            e_zapas (A/N)
          </label>
          <select
            id="e_zapas"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_zapas', { required: true })}
          >
            <option value="A">A</option>
            <option value="N">N</option>
          </select>
        </div>

        <div>
          <label htmlFor="e_muzstva" className="mb-1 block text-sm text-gray-700">
            e_muzstva (A/N)
          </label>
          <select
            id="e_muzstva"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_muzstva', { required: true })}
          >
            <option value="A">A</option>
            <option value="N">N</option>
          </select>
        </div>

        <div>
          <label htmlFor="e_rocnik" className="mb-1 block text-sm text-gray-700">
            Ročník
          </label>
          <select
            id="e_rocnik"
            disabled={rocnikyLoading}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_rocnik', { required: 'Vyberte ročník.' })}
          >
            <option value="">— vyberte —</option>
            {rocniky?.map((r) => (
              <option key={r.r_id} value={r.r_id}>
                {r.r_rocnik}
              </option>
            ))}
          </select>
          {errors.e_rocnik && <p className="mt-1 text-sm text-red-600">{errors.e_rocnik.message}</p>}
        </div>

        <div>
          <label htmlFor="e_platnost" className="mb-1 block text-sm text-gray-700">
            Platnost (A/N)
          </label>
          <select
            id="e_platnost"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_platnost', { required: true })}
          >
            <option value="A">A</option>
            <option value="N">N</option>
          </select>
        </div>

        <div>
          <label htmlFor="e_datum_pl" className="mb-1 block text-sm text-gray-700">
            Datum platnosti (nepovinné)
          </label>
          <input
            id="e_datum_pl"
            type="date"
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            {...register('e_datum_pl')}
          />
        </div>
      </div>
    </>
  )
}
