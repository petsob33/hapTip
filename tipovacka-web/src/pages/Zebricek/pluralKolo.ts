/** Skloňování "kolo" pro počet (1 kolo, 2–4 kola, 5+ kol). */
export function pluralKolo(count: number): string {
  if (count === 1) return 'kolo'
  if (count >= 2 && count <= 4) return 'kola'
  return 'kol'
}
