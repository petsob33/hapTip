/**
 * Statické obrázky (znaky týmů, fotky hráčů) — legacy sloupce `muzstva.m_znak`
 * a `hraci.h_foto` nesou jen název souboru, ne URL. Soubory se čekají přímo
 * v `public/` API serveru (ne přes REST API), takže base URL je bez `/api`
 * přípony z VITE_API_URL.
 */
const ASSET_BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/api\/?$/, '')

/** `muzstva.m_znak` už obsahuje příponu (.gif/.png) — očekávaná cesta: `public/img/znaky/<m_znak>`. */
export function teamCrestUrl(m_znak: string): string {
  return `${ASSET_BASE_URL}/img/znaky/${m_znak}`
}

/**
 * `hraci.h_foto` je bez přípony — .jpg je odhad (na serveru zatím tyhle
 * soubory nejsou, viz docs/api-todo.md). Očekávaná cesta:
 * `public/img/hraci/<h_foto>.jpg`.
 */
export function playerPhotoUrl(h_foto: string): string {
  return `${ASSET_BASE_URL}/img/hraci/${h_foto}.jpg`
}
