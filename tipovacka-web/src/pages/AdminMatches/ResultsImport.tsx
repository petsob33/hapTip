import { useState } from 'react'
import { useRocniky } from '../../api/hooks/useRocniky'
import { useResultsImportApply, useResultsImportPreview } from '../../api/hooks/useResultsImport'
import { ApiError } from '../../api/client'

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.body?.errors?.rocnik?.[0] ?? err.message
  }
  return 'Import se nezdařil.'
}

/**
 * Stáhne z API-Football dohrané zápasy pro vybraný ročník a napáruje je na
 * interní zápasy podle jmen týmů + data (viz ResultsImportService na
 * backendu). Preview nic nezapisuje — teprve potvrzením vybraných řádků se
 * góly zapíšou a spustí se bodování tipů.
 */
export default function ResultsImport() {
  const { data: rocniky } = useRocniky()
  const [rocnikId, setRocnikId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const preview = useResultsImportPreview()
  const apply = useResultsImportApply()

  function handleLoad() {
    if (rocnikId === null) return
    apply.reset()
    preview.mutate(rocnikId, {
      onSuccess: (data) => setSelected(new Set(data.matched.map((m) => m.match_id))),
    })
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleApply() {
    if (rocnikId === null) return
    apply.mutate({ rocnik: rocnikId, matchIds: [...selected] }, { onSuccess: () => preview.reset() })
  }

  return (
    <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Ročník pro import výsledků"
          value={rocnikId ?? ''}
          onChange={(event) => setRocnikId(event.target.value ? Number(event.target.value) : null)}
          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
        >
          <option value="">Vyber ročník…</option>
          {rocniky?.map((r) => (
            <option key={r.r_id} value={r.r_id}>
              {r.r_rocnik}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleLoad}
          disabled={rocnikId === null || preview.isPending}
          className="rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {preview.isPending ? 'Načítám…' : 'Načíst výsledky z API'}
        </button>
      </div>

      {preview.isError && <p className="mt-3 text-sm text-red-600">{errorMessage(preview.error)}</p>}

      {preview.isSuccess && (
        <div className="mt-4">
          {preview.data.matched.length === 0 && preview.data.unmatched.length === 0 && (
            <p className="text-sm text-slate-400">Žádné dohrané zápasy k importu.</p>
          )}

          {preview.data.matched.length > 0 && (
            <>
              <ul className="flex flex-col gap-2">
                {preview.data.matched.map((m) => (
                  <li
                    key={m.match_id}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                  >
                    <input type="checkbox" checked={selected.has(m.match_id)} onChange={() => toggle(m.match_id)} />
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                      Kolo {m.round}
                    </span>
                    <span className="flex-1 font-medium text-slate-900">
                      {m.home_team} – {m.away_team}
                    </span>
                    <span className="tabular-nums text-slate-400 line-through">
                      {m.current_home_goals ?? '–'}:{m.current_away_goals ?? '–'}
                    </span>
                    <span className="tabular-nums font-bold text-slate-900">
                      {m.proposed_home_goals}:{m.proposed_away_goals}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleApply}
                disabled={selected.size === 0 || apply.isPending}
                className="mt-4 rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-40"
              >
                {apply.isPending ? 'Zapisuji…' : `Zapsat vybrané výsledky (${selected.size})`}
              </button>
            </>
          )}

          {preview.data.unmatched.length > 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-700">
              Nenapárováno ({preview.data.unmatched.length}) — zadej ručně:
              <ul className="mt-1 list-disc pl-4">
                {preview.data.unmatched.map((m) => (
                  <li key={m.match_id}>
                    Kolo {m.round}: {m.home_team} – {m.away_team}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {apply.isError && <p className="mt-3 text-sm text-red-600">{errorMessage(apply.error)}</p>}
      {apply.isSuccess && (
        <p className="mt-3 text-sm font-medium text-green-700">Zapsáno {apply.data.updated.length} výsledků.</p>
      )}
    </div>
  )
}
