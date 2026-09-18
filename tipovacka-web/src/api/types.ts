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

/** Vstup pro POST /rocniky (admin). */
export interface RocnikCreateInput {
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

/**
 * GET /user — model App\Models\Player (tabulka `hraci`), bez skrytého h_pasw.
 * `h_foto` je legacy sloupec bez přípony (např. "martin") — viz
 * src/api/assets.ts, playerPhotoUrl().
 */
export interface User {
  h_id: number
  h_jmeno: string
  h_prijmeni: string
  h_nick: string
  h_email: string
  h_foto: string | null
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
  /**
   * Tip přihlášeného hráče na tento zápas — jen u GET /matches?rocnik=…
   * (MatchController::index eager loaduje `tips` omezené na aktuálního
   * uživatele). U ostatních endpointů (POST/PUT /matches, GET /untipped)
   * je vždy `null`, i když tip existuje.
   */
  my_tip: {
    t_id: number
    t_tip_d: number
    t_tip_h: number
    t_body: number | null
  } | null
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
// Import výsledků — GET /matches/import-results/preview, POST .../apply
// ---------------------------------------------------------------------------

/** Zápas napárovaný na fixture z API-Football, se zjištěným výsledkem. */
export interface ResultsImportMatchedItem {
  match_id: number
  round: number
  home_team: string | null
  away_team: string | null
  date: string | null
  current_home_goals: number | null
  current_away_goals: number | null
  proposed_home_goals: number | null
  proposed_away_goals: number | null
  external_fixture_id?: number | null
  /** Shoda jmen týmů 0–100 (similar_text na backendu). */
  match_confidence: number
}

/** Zápas, ke kterému se v datech z API-Football nenašla dost jistá shoda. */
export interface ResultsImportUnmatchedItem {
  match_id: number
  round: number
  home_team: string | null
  away_team: string | null
  date: string | null
}

/** Odpověď GET /matches/import-results/preview — nic se jí nezapisuje. */
export interface ResultsImportPreview {
  matched: ResultsImportMatchedItem[]
  unmatched: ResultsImportUnmatchedItem[]
}

/** Odpověď POST /matches/import-results/apply. */
export interface ResultsImportApplyResult {
  updated: number[]
}

/** Odpověď POST /matches/import-results/manual-preview. */
export interface ManualResultsImportPreview {
  matched: ResultsImportMatchedItem[]
  unmatched: ResultsImportUnmatchedItem[]
  /** Řádky vloženého textu, které neodpovídaly vzoru "Domácí - Hosté 2:1". */
  parse_errors: { line: number; text: string }[]
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
  // Kolo zápasu (zapasy.z_kolo), dotažené stejně jako home_team/away_team.
  round: number | null
  t_hrac: number
  // Přezdívka hráče (hraci.h_nick), stejné pojmenování jako LeaderboardEntry.h_nick.
  h_nick: string | null
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

/** Tělo PUT /tips/{id} (TipsController::update), vše volitelné. */
export interface TipUpdateInput {
  t_tip_d?: number
  t_tip_h?: number
}

// ---------------------------------------------------------------------------
// Vzájemné zápasy (H2H) — GET /matches/{match}/h2h, endpoint zatím neexistuje,
// viz docs/api-todo.md. Frontend proto zatím pracuje s mockem (useH2H).
// ---------------------------------------------------------------------------

/** Jeden odehraný zápas v historii vzájemných zápasů dvou týmů. */
export interface H2HMatch {
  id: number
  date: string
  home_team: string
  away_team: string
  home_goals: number
  away_goals: number
  season: number | null
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
  // NULL, ne 0 — ověřeno proti API. PDO navíc SUM() vrací jako číselný
  // string, ne number — přetypuj přes Number() před jakoukoli aritmetikou
  // (viz useMyStandings.ts).
  total_points: number | string | null
}

export interface LeaderboardResponse {
  status: 'success'
  rocnik: string
  data: LeaderboardEntry[]
}

// ---------------------------------------------------------------------------
// Umístění napříč ročníky — GET /leadboard/podiums
// ---------------------------------------------------------------------------

/** Kolikrát byl hráč na 1./2./3. místě žebříčku napříč všemi ročníky. */
export interface PodiumEntry {
  h_nick: string
  // SUM(CASE ...) na backendu — stejně jako u LeaderboardEntry.total_points
  // chodí z PDO jako číselný string, ne number.
  first: number | string
  second: number | string
  third: number | string
}

export interface PodiumsResponse {
  data: PodiumEntry[]
}

// ---------------------------------------------------------------------------
// Statistiky hráčů — GET /players/{player}/stats, GET /players/h2h
// ---------------------------------------------------------------------------

/** Jedno kolo v `PlayerStats.form`, seřazeno chronologicky vzestupně. */
export interface PlayerFormRound {
  round: number
  points: number
}

/**
 * GET /players/{player}/stats?rocnik=&posledni= — počítá se jen z kol, kde
 * má hráč aspoň jeden obodovaný tip (t_body not null), viz docs/api.md.
 */
/** Rozklad `PlayerStats.accuracy` podle bodování tipu (viz `TipScoringService`). */
export interface PlayerAccuracy {
  tips_scored: number
  exact: number
  exact_pct: number | null
  outcome: number
  outcome_pct: number | null
  miss: number
  miss_pct: number | null
}

export interface PlayerStats {
  rocnik: string | number | null
  player: { h_id: number; h_nick: string }
  rounds_played: number
  total_points: number
  avg_points_per_round: number | null
  form: PlayerFormRound[]
  accuracy: PlayerAccuracy
}

/**
 * GET /players/h2h?player1=&player2=&rocnik= — srovnání jen na zápasech,
 * které oba hráči obodovaně otipovali.
 */
export interface PlayerH2HResponse {
  rocnik: string | number | null
  player1: { h_id: number; h_nick: string }
  player2: { h_id: number; h_nick: string }
  matches_compared: number
  wins: { player1: number; player2: number; draws: number }
  total_points: { player1: number; player2: number }
}

// ---------------------------------------------------------------------------
// Extra tipy — GET/POST/PUT/DELETE /extra a /ExtraTip
// ---------------------------------------------------------------------------

/** `extra.e_zapas`/`e_muzstva` jsou navenek sjednocené do jednoho typu (`App\Enums\ExtraType`). */
export type ExtraType = 'zapas' | 'muzstvo' | 'volna'

/** Tým vložený tam, kde extra typu `muzstvo` nese jen `muzstva.m_id`. */
export interface ExtraTeamRef {
  m_id: number
  m_nazev: string
}

/** GET /extra — resource `ExtraResource` (ne syrový model, viz e_typ/e_vysledek_tym/my_tip). */
export interface Extra {
  e_id: number
  e_pril: string
  e_typ: ExtraType
  e_goly_d: number | null
  e_goly_h: number | null
  e_vysledek: string | null
  e_vysledek_tym: ExtraTeamRef | null
  e_rocnik: number
  e_platnost: AnoNe
  /** ISO timestamp jako u Match.date, ne holé "YYYY-MM-DD". */
  e_datum_pl: string | null
  e_autor: number
  /** Vlastní tip přihlášeného hráče na tuto extra otázku, nebo null. */
  my_tip: MyExtraTip | null
}

/** Tělo POST /extra (validace v ExtraController::store); e_autor doplňuje backend sám. */
export interface ExtraCreateInput {
  e_pril: string
  e_typ: ExtraType
  e_goly_d?: number | null
  e_goly_h?: number | null
  e_vysledek_tym?: number | null
  e_vysledek_text?: string | null
  e_rocnik: number
  e_platnost: AnoNe
  e_datum_pl?: string | null
}

/** Tělo PUT /extra/{extra} (validace v ExtraController::update), vše volitelné. */
export type ExtraUpdateInput = Partial<ExtraCreateInput>

/** GET /ExtraTip — resource `ExtraTipResource` (ne syrový model, viz ex_tip_tym). */
export interface ExtraTip {
  ex_id: number
  ex_extra: number
  ex_hrac: number
  ex_tip: string | null
  ex_tip_d: number | null
  ex_tip_h: number | null
  ex_tip_tym: ExtraTeamRef | null
  ex_body: number | null
  ex_datum: string
  ex_rocnik: number
}

/** Tvar `my_tip` v GET /extra — stejné jako ExtraTip bez ex_extra/ex_hrac/ex_datum/ex_rocnik. */
export type MyExtraTip = Pick<ExtraTip, 'ex_id' | 'ex_tip' | 'ex_tip_d' | 'ex_tip_h' | 'ex_tip_tym' | 'ex_body'>

/** Tělo POST /ExtraTip (validace v ExtraTipController::store), pole podle typu extra otázky. */
export interface ExtraTipCreateInput {
  ex_extra: number
  ex_rocnik: number
  ex_tip_d?: number | null
  ex_tip_h?: number | null
  ex_tip_tym?: number | null
  ex_tip_text?: string | null
}

/** Tělo PUT /ExtraTip/{id} (validace v ExtraTipController::update), bez ex_extra, vše volitelné. */
export type ExtraTipUpdateInput = Partial<Omit<ExtraTipCreateInput, 'ex_extra'>>

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
 * Tvar odpovědi endpointů vracejících syrový výsledek `->paginate()` přímo
 * (jen Team — GET /team; Leaderboard nemá stránkování, má vlastní obálku).
 * Zaměnit s `PaginatedResource` níže je snadné, ale rozdíl je zásadní:
 * cokoliv jde přes `SomeResource::collection($x)->response()` (Match, Tip,
 * Extra, ExtraTip) vrací nested {data, links, meta} shape z
 * `PaginatedResource`, ne tenhle.
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
 * Tvar odpovědi endpointů vracejících `SomeResource::collection($x)->response()`
 * — Laravelí výchozí nested {data, links, meta} obálka nad stránkovaným
 * resultem (GET /matches, GET /untipped, GET /myTips, GET /extra, GET
 * /ExtraTip). Ověřeno přímo v ExtraController/ExtraTipController i curlem
 * proti běžícímu API — TODO z předchozí verze (přesný tvar links/meta)
 * tímhle odpadá, shoda potvrzena.
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
