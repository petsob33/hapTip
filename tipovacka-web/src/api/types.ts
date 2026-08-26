// TS typy entit podle docs/api.md (tipovacka-api). Držet v souladu se skutečným
// API kontraktem — neupravovat na základě dohadů, jen podle docs/api.md.

/** Ano/ne příznak používaný v legacy sloupcích (`A` = ano, `N` = ne). */
export type AnoNe = 'A' | 'N'

// ---------------------------------------------------------------------------
// Ročníky — GET /rocniky
// ---------------------------------------------------------------------------

/**
 * `rocniky.r_id` je to, na co odkazují `z_rocnik`/`t_rocnik`/`e_rocnik` na
 * zápasech/tipech/extra tipech — NENÍ to kalendářní rok. Obsahuje domácí
 * ligové sezóny ("2025-26") i turnaje ("ME 2016"), viz docs/api.md.
 */
export interface Rocnik {
  r_id: number
  r_rocnik: string
  r_liga: number
}

// ---------------------------------------------------------------------------
// Auth / uživatel
// ---------------------------------------------------------------------------

/** Odpověď POST /register a POST /login. */
export interface AuthTokenResponse {
  token: string
}

/** GET /user — model App\Models\Player (tabulka `hraci`), bez skrytého h_pasw. */
export interface User {
  h_id: number
  h_jmeno: string
  h_prijmeni: string
  h_nick: string
  h_email: string
  h_admin: AnoNe
  h_platnost: AnoNe
}

// ---------------------------------------------------------------------------
// Zápasy — GET/POST/PUT /matches, GET /untipped (tvar dle MatchResource)
// ---------------------------------------------------------------------------

export interface Match {
  id: number
  home_team: string | null
  away_team: string | null
  /** ISO timestamp, např. "2026-09-15T00:00:00.000000Z" — ověřeno proti API. */
  date: string
  round: number
  season: number | null
  home_goals: number | null
  away_goals: number | null
}

/** Tělo POST /matches (App\Http\Requests\StoreMatchRequest). */
export interface MatchCreateInput {
  z_domaci: number
  z_hoste: number
  z_datum: string
  z_kolo: number
  z_rocnik?: number | null
}

/** Tělo PUT /matches/{match} (App\Http\Requests\UpdateMatchRequest), vše volitelné. */
export interface MatchUpdateInput {
  z_domaci?: number
  z_hoste?: number
  z_datum?: string
  z_kolo?: number
  z_rocnik?: number | null
  z_goly_d?: number | null
  z_goly_h?: number | null
}

// ---------------------------------------------------------------------------
// Tipy — GET/POST/PUT/DELETE /tips, GET /myTips (tvar dle TipResource)
// ---------------------------------------------------------------------------

export interface Tip {
  t_id: number
  t_zapas: number
  // Jméno soupeřů a datum zápasu, dotažené z `match.homeTeam`/`match.awayTeam`
  // v TipResource — `null`, pokud zápas s daným t_zapas neexistuje (osiřelý tip).
  home_team: string | null
  away_team: string | null
  /** ISO timestamp jako u Match.date, ne holé "YYYY-MM-DD". */
  date: string | null
  t_hrac: number
  t_tip_d: number
  t_tip_h: number
  t_body: number | null
  t_datum: string
  // Sloupec `tipy.t_rocnik` je int(11) — ověřeno proti DB — i když ho
  // TipsController::store validuje jako 'string' na vstupu (viz TipCreateInput).
  t_rocnik: number
  // Sloupec `tipy.t_joker` je int(11), default 0 — ověřeno proti DB.
  t_joker: number
}

/**
 * Tělo POST /tips ($request->validate() v TipsController::store). t_hrac/t_datum
 * doplňuje backend sám. t_rocnik musí být string, i když se v odpovědi
 * (Tip.t_rocnik) vrací jako number — validace `'required|string'` netolerantní
 * vůči JSON číslu.
 */
export interface TipCreateInput {
  t_zapas: number
  t_tip_d: number
  t_tip_h: number
  t_rocnik: string
}

// ---------------------------------------------------------------------------
// Týmy — GET/POST /team (syrový model Team, tabulka `muzstva`)
// ---------------------------------------------------------------------------

export interface Team {
  m_id: number
  m_nazev: string
  // Reálný sloupec navíc oproti Team::$fillable — ověřeno proti běžícímu
  // API (GET /team), do TeamController::store se nevaliduje/nenastavuje.
  m_kratky: string
  m_mesto: string
  m_znak: string
  m_platnost: AnoNe
  m_liga: number
}

/** Tělo POST /team (validace v TeamController::store). */
export interface TeamCreateInput {
  m_nazev: string
  m_mesto: string
  m_znak: string
  m_platnost: AnoNe
  m_liga: number
}

// ---------------------------------------------------------------------------
// Žebříček — GET /leadboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  h_nick: string
  // SQL SUM(tipy.t_body) přes hráče bez jediného obodovaného tipu vrátí
  // NULL, ne 0 — ověřeno proti API.
  total_points: number | null
}

export interface LeaderboardResponse {
  status: 'success'
  rocnik: string
  data: LeaderboardEntry[]
}

// ---------------------------------------------------------------------------
// Extra tipy — GET/POST/PUT/DELETE /extra (syrový model Extra, tabulka `extra`)
// ---------------------------------------------------------------------------

export interface Extra {
  e_id: number
  e_pril: string
  e_vysledek: string | null
  e_goly_d: number | null
  e_goly_h: number | null
  e_zapas: AnoNe
  e_muzstva: AnoNe
  e_rocnik: number
  e_platnost: AnoNe
  /** ISO timestamp jako u Match.date, ne holé "YYYY-MM-DD". */
  e_datum_pl: string | null
  e_autor: number
}

/** Tělo POST /extra (validace v ExtraController::store); e_autor doplňuje backend sám. */
export interface ExtraCreateInput {
  e_pril: string
  e_vysledek?: string | null
  e_goly_d?: number | null
  e_goly_h?: number | null
  e_zapas: AnoNe
  e_muzstva: AnoNe
  e_rocnik: number
  e_platnost: AnoNe
  e_datum_pl?: string | null
}

/** Tělo PUT /extra/{extra} (validace v ExtraController::update), vše volitelné. */
export type ExtraUpdateInput = Partial<ExtraCreateInput>

/** GET /ExtraTip (syrový model ExtraTip, tabulka `extratipy`). */
export interface ExtraTip {
  ex_id: number
  ex_extra: number
  ex_hrac: number
  // TODO: ověřit typy/výchozí hodnoty polí níže — v docs/api.md nejsou
  // pole nastavovaná/validovaná žádným controllerem (chybí store/update).
  ex_tip: unknown
  ex_tip_d: unknown
  ex_tip_h: unknown
  ex_body: unknown
  ex_datum: string
  ex_rocnik: unknown
}

// ---------------------------------------------------------------------------
// Obálky odpovědí
// ---------------------------------------------------------------------------

/** Odkaz ve stránkovacím poli `links` standardního Laravel paginátoru. */
export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

/**
 * Tvar odpovědi endpointů vracejících syrový výsledek `->paginate()`
 * (Tips, Team, Extra, ExtraTip, Leaderboard nemá — ten má vlastní obálku).
 */
export interface Paginated<T> {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

/**
 * Tvar odpovědi endpointů přes MatchResource::collection()->response()
 * (GET /matches, GET /untipped).
 * TODO: ověřit přesný tvar `links`/`meta` — Laravel jej generuje
 * automaticky a v kódu není přepsán, viz docs/api.md.
 */
export interface PaginatedResource<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

// ---------------------------------------------------------------------------
// Chyby
// ---------------------------------------------------------------------------

/** Tvar chybové odpovědi API (401/403/404/422), viz docs/api.md. */
export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}
