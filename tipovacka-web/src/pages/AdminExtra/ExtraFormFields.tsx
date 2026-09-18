import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ExtraFormValues } from './ExtraForm'
import type { Rocnik, Team } from '../../api/types'

interface ExtraFormFieldsProps {
  register: UseFormRegister<ExtraFormValues>
  watch: UseFormWatch<ExtraFormValues>
  errors: FieldErrors<ExtraFormValues>
  rocniky: Rocnik[] | undefined
  rocnikyLoading: boolean
  teams: Team[] | undefined
  teamsLoading: boolean
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function ExtraFormFields({
  register,
  watch,
  errors,
  rocniky,
  rocnikyLoading,
  teams,
  teamsLoading,
}: ExtraFormFieldsProps) {
  const e_typ = watch('e_typ')

  return (
    <>
      <div>
        <label htmlFor="e_pril" className="mb-1.5 block text-sm font-medium text-slate-600">
          Příloha / otázka
        </label>
        <input
          id="e_pril"
          type="text"
          maxLength={250}
          className={inputClass}
          {...register('e_pril', { required: 'Zadejte text.' })}
        />
        {errors.e_pril && <p className="mt-1 text-sm text-red-600">{errors.e_pril.message}</p>}
      </div>

      <div>
        <label htmlFor="e_typ" className="mb-1.5 block text-sm font-medium text-slate-600">
          Typ otázky
        </label>
        <select id="e_typ" className={inputClass} {...register('e_typ', { required: true })}>
          <option value="zapas">Skóre zápasu</option>
          <option value="muzstvo">Vítězné mužstvo</option>
          <option value="volna">Volná odpověď</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {e_typ === 'zapas' && (
          <>
            <div>
              <label htmlFor="e_goly_d" className="mb-1.5 block text-sm font-medium text-slate-600">
                Výsledek — góly domácí (nepovinné)
              </label>
              <input id="e_goly_d" type="number" className={inputClass} {...register('e_goly_d')} />
            </div>

            <div>
              <label htmlFor="e_goly_h" className="mb-1.5 block text-sm font-medium text-slate-600">
                Výsledek — góly hosté (nepovinné)
              </label>
              <input id="e_goly_h" type="number" className={inputClass} {...register('e_goly_h')} />
            </div>
          </>
        )}

        {e_typ === 'muzstvo' && (
          <div className="col-span-2">
            <label htmlFor="e_vysledek_tym" className="mb-1.5 block text-sm font-medium text-slate-600">
              Výsledek — vítězný tým (nepovinné)
            </label>
            <select
              id="e_vysledek_tym"
              disabled={teamsLoading}
              className={inputClass}
              {...register('e_vysledek_tym')}
            >
              <option value="">— zatím neurčeno —</option>
              {teams?.map((team) => (
                <option key={team.m_id} value={team.m_id}>
                  {team.m_nazev}
                </option>
              ))}
            </select>
          </div>
        )}

        {e_typ === 'volna' && (
          <div className="col-span-2">
            <label htmlFor="e_vysledek_text" className="mb-1.5 block text-sm font-medium text-slate-600">
              Výsledek (nepovinné)
            </label>
            <input
              id="e_vysledek_text"
              type="text"
              maxLength={250}
              className={inputClass}
              {...register('e_vysledek_text')}
            />
          </div>
        )}

        <div>
          <label htmlFor="e_rocnik" className="mb-1.5 block text-sm font-medium text-slate-600">
            Ročník
          </label>
          <select
            id="e_rocnik"
            disabled={rocnikyLoading}
            className={inputClass}
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
          <label htmlFor="e_platnost" className="mb-1.5 block text-sm font-medium text-slate-600">
            Platnost (A/N)
          </label>
          <select id="e_platnost" className={inputClass} {...register('e_platnost', { required: true })}>
            <option value="A">A</option>
            <option value="N">N</option>
          </select>
        </div>

        <div>
          <label htmlFor="e_datum_pl" className="mb-1.5 block text-sm font-medium text-slate-600">
            Datum platnosti (nepovinné)
          </label>
          <input id="e_datum_pl" type="date" className={inputClass} {...register('e_datum_pl')} />
        </div>
      </div>
    </>
  )
}
