# Tipovačka API – dokumentace

Zdroj: `docs/routes.json`, controllery v `app/Http/Controllers`, FormRequesty v `app/Http/Requests`, API Resource `app/Http/Resources/MatchResource.php` a modely v `app/Models`.

Dokumentovány jsou pouze routy pod `api/*` (routy `web`, `sanctum/csrf-cookie`, `storage/{path}`, `up` a dev-only `dev/api` nejsou součástí API a jsou vynechány).

## Obecné informace

- **Base path:** `/api`
- **Formát:** JSON (`Content-Type: application/json`)
- **Autentizace:** [Laravel Sanctum](https://laravel.com/docs/sanctum) – bearer token získaný z `/register` nebo `/login` (pole `token` v odpovědi). Posílá se v hlavičce `Authorization: Bearer <token>`.
- **Role:** middleware `admin` (alias pro `App\Http\Middleware\EnsureUserIsAdmin`) vyžaduje, aby přihlášený hráč měl `h_admin === 'A'`.
- **Stránkování:** endpointy, které používají `->paginate(10)` a vrací syrový výsledek Eloquent stránkování (ne přes `response()->json($x, ...)` obalený resource), mají tvar standardního Laravel paginátoru:

```json
{
  "current_page": 1,
  "data": [ /* položky, viz jednotlivé endpointy */ ],
  "first_page_url": "http://.../api/tips?page=1",
  "from": 1,
  "last_page": 3,
  "last_page_url": "http://.../api/tips?page=3",
  "links": [ /* ... */ ],
  "next_page_url": "http://.../api/tips?page=2",
  "path": "http://.../api/tips",
  "per_page": 10,
  "prev_page_url": null,
  "to": 10,
  "total": 25
}
```

U endpointů přes `MatchResource::collection(...)->response()` (`GET /matches`, `GET /untipped`) je tvar jiný — ověřeno přímo proti běžícímu API:

```json
{
  "data": [ /* položky MatchResource */ ],
  "links": {
    "first": "http://.../api/matches?page=1",
    "last": "http://.../api/matches?page=848",
    "prev": null,
    "next": "http://.../api/matches?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 848,
    "links": [ /* pole odkazů na jednotlivé stránky, label/url/page/active */ ],
    "path": "http://.../api/matches",
    "per_page": 10,
    "to": 10,
    "total": 8477
  }
}
```

### Chybové odpovědi (obecně pro všechny endpointy)

| Kód | Kdy nastane | Tvar odpovědi |
|---|---|---|
| `401 Unauthorized` | Chybí nebo je neplatný `Authorization: Bearer <token>` na routě vyžadující `auth:sanctum`. | `{"message": "Unauthenticated."}` |
| `403 Forbidden` | Přihlášený uživatel nemá roli admin na routě s middlewarem `admin`, nebo se pokouší upravit/smazat cizí záznam (viz konkrétní endpointy). | `{"message": "Tato akce je dostupná pouze administrátorům."}` (admin middleware) nebo `{"message": "<vlastní zpráva>"}` (vlastnická kontrola v controlleru) |
| `404 Not Found` | Route model binding (`{match}`, `{extra}`) nebo `findOrFail()` nenajde záznam. | `{"message": "No query results for model [App\\Models\\...] <id>"}` |
| `422 Unprocessable Entity` | Selhání validace (`FormRequest::rules()` nebo `$request->validate([...])`). | `{"message": "The <pole> field is required. (and X more errors)", "errors": {"<pole>": ["<chybová zpráva>"]}}` |

---

## Autentizace

### `POST /api/register`

- **Auth:** ne
- **Path parametry:** žádné
- **Query parametry:** žádné
- **Request body** (`App\Http\Requests\RegisterRequest`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `name` | string | ano | max 255 znaků |
| `email` | string (email) | ano | unikátní v `hraci.h_email` |
| `password` | string | ano | min 8 znaků |

- **Odpověď `201 Created`:**

```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### `POST /api/login`

- **Auth:** ne
- **Path parametry:** žádné
- **Query parametry:** žádné
- **Request body** (`App\Http\Requests\LoginRequest`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `email` | string (email) | ano | – |
| `password` | string | ano | – |

- **Odpověď `200 OK`:**

```json
{
  "token": "2|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

- **Poznámka:** při neplatných údajích vrací `422` s obecnou zprávou u pole `email` (`"Invalid credentials."`), záměrně stejnou pro neexistující e-mail i špatné heslo (viz komentář v `AuthService::login`).

### `GET /api/user`

- **Auth:** ano (žádná specifická role)
- **Path parametry:** žádné
- **Query parametry:** žádné
- **Request body:** žádný
- **Odpověď `200 OK`** (přihlášený model `App\Models\Player`, sloupec `h_pasw` je skrytý přes `$hidden`):

```json
{
  "h_id": 1,
  "h_jmeno": "Jan",
  "h_prijmeni": "Novák",
  "h_nick": "honza",
  "h_email": "jan@example.com",
  "h_admin": "N",
  "h_platnost": "A"
}
```

TODO: ověřit úplný seznam sloupců tabulky `hraci` – model `Player` nemá definovaný `$fillable` výčet odpovídající všem sloupcům tabulky (jde o legacy tabulku importovanou z SQL dumpu), takže odpověď může obsahovat i další pole navíc k výše uvedeným.

---

## Ročníky (`/api/rocniky`)

**Důležité:** `z_rocnik` (zápasy), `t_rocnik` (tipy) a `e_rocnik` (extra tipy) **nejsou kalendářní rok** — jsou to cizí klíče na `rocniky.r_id`. Tabulka `rocniky` obsahuje jak domácí ligové sezóny (`"1993-94"` … `"2025-26"`, `r_liga` = 1), tak mezinárodní turnaje (`"ME 2016"`, `"MS 2014"` apod., `r_liga` = 2/3, odkaz na tabulku `liga`). Ověřeno přímo v DB.

### `GET /api/rocniky`

- **Auth:** ano (žádná specifická role)
- **Query parametry:** žádné
- **Request body:** žádný
- **Odpověď `200 OK`** — **bez stránkování** (na rozdíl od většiny ostatních seznamů; je to malý, pomalu rostoucí číselník, ne data k procházení):

```json
[
  { "r_id": 33, "r_rocnik": "2025-26", "r_liga": 1 },
  { "r_id": 105, "r_rocnik": "ME 2016", "r_liga": 2 }
]
```

- **Poznámka:** žádný sloupec neoznačuje "aktuální" ročník — frontend si musí výchozí hodnotu odvodit sám (viz `tipovacka-web`).

---

## Zápasy (`/api/matches`, `/api/untipped`)

Odpovědi endpointů níže procházejí přes `App\Http\Resources\MatchResource`.

### `GET /api/matches`

- **Auth:** ano (žádná specifická role)
- **Query parametry:** `page` (stránkování, `paginate(10)`)
- **Request body:** žádný
- **Odpověď `200 OK`:**

```json
{
  "data": [
    {
      "id": 1,
      "home_team": "FC Příklad",
      "away_team": "SK Test",
      "date": "2026-08-30T00:00:00.000000Z",
      "round": 5,
      "season": 33,
      "home_goals": null,
      "away_goals": null
    }
  ]
}
```
(plus stránkovací `links`/`meta`, viz sekce Stránkování výše)

**`season` = `rocniky.r_id`, ne kalendářní rok** — viz sekce Ročníky výše.

**Poznámka k `date`:** ověřeno proti běžícímu API — i když `GameMatch` má cast `'z_datum' => 'date'`, do JSON se serializuje jako plný ISO timestamp (`...T00:00:00.000000Z`), ne jako holé `YYYY-MM-DD`. Model nepřepisuje `serializeDate()`, takže se použije výchozí Carbon serializace.

### `GET /api/untipped`

- **Auth:** ano
- **Query parametry:** `page`
- **Request body:** žádný
- **Popis:** vrací nadcházející zápasy (`z_datum > now()`), na které přihlášený hráč ještě nemá vlastní tip.
- **Odpověď `200 OK`:** stejný tvar položky jako `GET /api/matches`.

### `POST /api/matches`

- **Auth:** ano, **role: admin**
- **Request body** (`App\Http\Requests\StoreMatchRequest`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `z_domaci` | integer | ano | musí existovat v `muzstva.m_id` |
| `z_hoste` | integer | ano | musí existovat v `muzstva.m_id`, různé od `z_domaci` |
| `z_datum` | date | ano | – |
| `z_kolo` | integer | ano | – |
| `z_rocnik` | integer | ne | `rocniky.r_id`, viz sekce Ročníky |

- **Odpověď `201 Created`:** tvar položky `MatchResource` (viz `GET /api/matches`).

### `PUT /api/matches/{match}`

- **Auth:** ano, **role: admin**
- **Path parametry:** `match` – ID zápasu (`zapasy.z_id`), route model binding
- **Request body** (`App\Http\Requests\UpdateMatchRequest`, všechna pole `sometimes`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `z_domaci` | integer | ne | existuje v `muzstva.m_id` |
| `z_hoste` | integer | ne | existuje v `muzstva.m_id`, různé od `z_domaci` |
| `z_datum` | date | ne | – |
| `z_kolo` | integer | ne | – |
| `z_rocnik` | integer | ne | `rocniky.r_id`, viz sekce Ročníky |
| `z_goly_d` | integer | ne | min 0 |
| `z_goly_h` | integer | ne | min 0 |

- **Odpověď `200 OK`:** tvar položky `MatchResource`.
- **Poznámka:** pokud jsou po update vyplněny oba `z_goly_d` a `z_goly_h`, spustí se navíc `TipScoringService::scoreMatch()` (bodování tipů), bez vlivu na tvar odpovědi.

### `DELETE /api/matches`

- **Auth:** ano, **role: admin**
- **Path/query parametry:** žádné podle `routes.json` (`uri: "api/matches"`, bez `{id}`)
- **Odpověď `200 OK`:** `{"message": "Tip byl úspěšně smazán."}`

**Poznámka / TODO: ověřit** – metoda `MatchController::destroy(Request $request, $id)` očekává parametr `$id`, ale routa `DELETE /api/matches` v `routes/api.php` a `routes.json` žádný `{id}` parametr nedefinuje. Za aktuálního stavu kódu tedy volání pravděpodobně selže chybou chybějícího argumentu (500), pokud `$id` nelze naplnit jinak. Zdrojová hodnota (path vs. body vs. query) není z kódu odvoditelná – nutno ověřit v reálném provozu/testu.

Dále: kontrola vlastnictví `$match->z_hrac !== $request->user()->id` odkazuje na sloupec `z_hrac`, který není v `$fillable` modelu `GameMatch` ani jinde v kódu zmíněný u tabulky `zapasy` – TODO: ověřit, zda tento sloupec v tabulce reálně existuje.

### `GET /api/matches/import-results/preview`

- **Auth:** ano, **role: admin**
- **Query parametry:** `rocnik` (povinné, `rocniky.r_id`)
- **Request body:** žádný
- **Popis:** stáhne z API-Football (`App\Services\FootballApiClient`) dohrané zápasy pro ligu/sezónu napárovanou na daný ročník (`config('services.football_api.leagues')`, klíčováno podle `rocniky.r_liga`) a napáruje je podle jmen týmů + data na interní zápasy v tomto ročníku, kterým ještě chybí `z_goly_d`/`z_goly_h`. Nic nezapisuje, jen vrací návrh (`App\Services\ResultsImportService::preview()`).
- **Odpověď `200 OK`:**

```json
{
  "matched": [
    {
      "match_id": 42,
      "round": 5,
      "home_team": "AC Sparta Praha",
      "away_team": "SK Slavia Praha",
      "date": "2026-08-30",
      "current_home_goals": null,
      "current_away_goals": null,
      "proposed_home_goals": 2,
      "proposed_away_goals": 1,
      "external_fixture_id": 123456,
      "match_confidence": 87.5
    }
  ],
  "unmatched": [
    {
      "match_id": 43,
      "round": 5,
      "home_team": "FK Jablonec",
      "away_team": "FC Zlín",
      "date": "2026-08-31"
    }
  ]
}
```

- **Chyby `422 Unprocessable Entity`:** `{"errors": {"rocnik": ["…"]}}` — když pro `rocniky.r_liga` daného ročníku chybí namapované externí ID ligy (`FOOTBALL_API_LEAGUE_ID_*` v `.env`), chybí `FOOTBALL_API_KEY`, nebo volání API-Football selže.

### `POST /api/matches/import-results/apply`

- **Auth:** ano, **role: admin**
- **Request body:**

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `rocnik` | integer | ano | `rocniky.r_id` |
| `match_ids` | integer[] | ano | každé ID musí existovat v `zapasy.z_id` |

- **Popis:** znovu natáhne návrh jako `GET .../preview` (mezistav preview se neukládá) a pro `match_ids`, které se v něm napárovaly, zapíše `z_goly_d`/`z_goly_h` přes `MatchService::update()` a spustí `TipScoringService::scoreMatch()` — stejný efekt jako ruční `PUT /matches/{match}`. ID, která se v novém návrhu nenapárují (např. výsledek mezitím zadal admin ručně), se tiše přeskočí.
- **Odpověď `200 OK`:** `{"updated": [42]}` — pole ID skutečně zapsaných zápasů.

### `POST /api/matches/import-results/manual-preview`

- **Auth:** ano, **role: admin**
- **Popis:** alternativa k `.../preview` bez závislosti na API-Football (`App\Services\ManualResultsImportService`) — admin vloží výsledky jako prostý text, jeden zápas na řádek: `Domácí - Hosté 2:1` (oddělovač týmů `-`/`–`/`vs`, skóre vždy jen `:`). Řádky, které neodpovídají vzoru, se vrátí v `parse_errors`, ne jako chyba requestu. Páruje se jen podle jmen týmů (bez data v textu) mezi zápasy ročníku, kterým ještě chybí výsledek.
- **Request body:**

| Pole | Typ | Povinné |
|---|---|---|
| `rocnik` | integer | ano (`rocniky.r_id`) |
| `text` | string | ano |

- **Odpověď `200 OK`:** stejný tvar `matched`/`unmatched` jako `GET .../preview` (bez `external_fixture_id`), navíc:

```json
{
  "matched": [...],
  "unmatched": [...],
  "parse_errors": [{"line": 3, "text": "tenhle řádek nejde přečíst"}]
}
```

### `POST /api/matches/import-results/manual-apply`

- **Auth:** ano, **role: admin**
- **Request body:** jako `manual-preview` (`rocnik`, `text`) plus `match_ids` (integer[], `zapasy.z_id`).
- **Popis:** znovu naparsuje `text` a pro potvrzené `match_ids` zapíše výsledek + spustí `TipScoringService::scoreMatch()`, stejně jako `.../apply`.
- **Odpověď `200 OK`:** `{"updated": [42]}`.

---

## Tipy (`/api/tips`, `/api/myTips`)

`GET`/`POST`/`PUT` vrací přes `App\Http\Resources\TipResource` — ne syrový model `App\Models\Tips` — a k tomu eager-loadují `match.homeTeam`/`match.awayTeam`, takže položka nese i jméno soupeřů a datum zápasu (dřív nesla jen `t_zapas`, ID zápasu, a klient si musel detail dotahovat sám — na frontendu se to řešilo jako `docs/api-todo.md` položka "GET /api/myTips vrací jen syrový tip, ne detail zápasu").

### `GET /api/tips`

- **Auth:** ano
- **Query parametry:** `rocnik` (filtr na `t_rocnik`), `page`
- **Request body:** žádný
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`):

```json
{
  "data": [
    {
      "t_id": 1,
      "t_zapas": 10,
      "home_team": "AC Sparta Praha",
      "away_team": "FC Hradec Králové",
      "date": "2026-05-24T00:00:00.000000Z",
      "t_hrac": 3,
      "t_tip_d": 1,
      "t_tip_h": 2,
      "t_body": null,
      "t_datum": "2026-08-20 10:00:00",
      "t_rocnik": 33,
      "t_joker": 0
    }
  ]
}
```

`home_team`/`away_team`/`date` používají stejné názvy jako `MatchResource` (viz sekce Zápasy) — je to týž tvar, jen vnořený do tipu. Budou `null`, pokud zápas s daným `t_zapas` neexistuje (osiřelý tip).

**Ověřeno proti DB:** `tipy.t_rocnik` a `tipy.t_joker` jsou oba `int(11)` (`t_joker` má default `0`). `t_rocnik` se tedy v odpovědi vrací jako JSON číslo, i když ho `TipsController::store`/`update` validuje na vstupu jako `'string'` (viz níže) — vstup musí být string, výstup je number. Hodnota je `rocniky.r_id` (viz sekce Ročníky), ne kalendářní rok — string `"33"`, ne `"2026"`.

### `POST /api/tips`

- **Auth:** ano
- **Request body** (`$request->validate([...])` v `TipsController::store`):

| Pole | Typ | Povinné |
|---|---|---|
| `t_zapas` | integer | ano |
| `t_tip_d` | integer | ano |
| `t_tip_h` | integer | ano |
| `t_rocnik` | string | ano |

  `t_hrac` (ID přihlášeného hráče) a `t_datum` (aktuální čas) doplňuje controller automaticky – neposílají se v requestu. `t_rocnik` je `rocniky.r_id` jako string (např. `"33"`), ne kalendářní rok — viz sekce Ročníky.

- **Odpověď `201 Created`:** stejný tvar položky jako v `GET /api/tips`.

### `PUT /api/tips`

- **Auth:** ano
- **Request body** (`$request->validate([...])` v `TipsController::update`, vše `sometimes|required`):

| Pole | Typ | Povinné |
|---|---|---|
| `t_zapas` | integer | ne (pokud přítomno, povinné) |
| `t_tip_d` | integer | ne |
| `t_tip_h` | integer | ne |
| `t_rocnik` | string | ne |

`t_rocnik` je `rocniky.r_id` jako string, ne kalendářní rok — viz sekce Ročníky.

- **Odpověď `200 OK`:** stejný tvar položky jako v `GET /api/tips`.
- **Odpověď `403 Forbidden`:** `{"message": "K úpravě tohoto tipu nemáte oprávnění."}`, pokud tip nepatří přihlášenému hráči.

**TODO: ověřit** – stejně jako u `DELETE /api/matches`, metoda `TipsController::update(Request $request, $id)` vyžaduje `$id`, ale routa `PUT /api/tips` (viz `routes.json`, žádné `{id}`) jej nedefinuje. Zdroj `$id` není z kódu odvoditelný.

### `DELETE /api/tips`

- **Auth:** ano
- **Odpověď `200 OK`:** `{"message": "Tip byl úspěšně smazán."}`
- **Odpověď `403 Forbidden`:** `{"message": "K smazání tohoto tipu nemáte oprávnění."}`, pokud tip nepatří přihlášenému hráči.

**TODO: ověřit** – controller metoda je pojmenována `destory` (překlep, ne `destroy`) a stejně jako výše vyžaduje `$id`, který routa `DELETE /api/tips` nedefinuje.

### `GET /api/myTips`

- **Auth:** ano
- **Query parametry:** `player` (filtr na `t_hrac`), `year` (filtr na `t_rocnik`), `page`
- **Request body:** žádný
- **Odpověď `200 OK`:** stránkovaný výsledek, stejný tvar položky jako `GET /api/tips`.
- **Poznámka:** navzdory názvu (`myTips`) filtrování podle vlastníka `player` funguje jen pokud je parametr explicitně poslán v query – endpoint sám o sobě nefiltruje automaticky podle přihlášeného uživatele.

---

## Týmy (`/api/team`)

Vrací syrový model `App\Models\Team` (tabulka `muzstva`).

### `GET /api/team`

- **Auth:** ano
- **Query parametry:** `page`
- **Request body:** žádný
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`):

```json
{
  "data": [
    {
      "m_id": 1,
      "m_nazev": "FC Příklad",
      "m_kratky": "FC Příklad",
      "m_mesto": "Praha",
      "m_znak": "fc-priklad.png",
      "m_platnost": "A",
      "m_liga": 1
    }
  ]
}
```

**Poznámka:** `m_kratky` je reálný sloupec tabulky `muzstva`, ověřeno proti běžícímu API — `Team::$fillable` ho ale neobsahuje, takže ho nejde nastavit přes `POST /api/team` (viz níže) ani ho nenastavuje žádný controller.

### `POST /api/team`

- **Auth:** ano (žádná specifická role – routa **není** chráněná middlewarem `admin`, na rozdíl od `/api/matches` a `/api/extra`)
- **Request body** (`$request->validate([...])` v `TeamController::store`):

| Pole | Typ | Povinné |
|---|---|---|
| `m_nazev` | string | ano |
| `m_mesto` | string | ano |
| `m_znak` | string | ano |
| `m_platnost` | string | ano |
| `m_liga` | integer | ano |

`m_kratky` se přes tento endpoint nenastavuje (viz poznámka výše).

- **Odpověď `201 Created`:** stejný tvar položky jako v `GET /api/team`.

---

## Žebříček (`/api/leadboard`)

### `GET /api/leadboard`

- **Auth:** ano
- **Query parametry:** `rocnik` (výchozí: aktuální rok, `date('Y')`)
- **Request body:** žádný
- **Odpověď `200 OK`:**

```json
{
  "status": "success",
  "rocnik": "2026",
  "data": [
    {
      "h_nick": "honza",
      "total_points": 42
    }
  ]
}
```

- **Poznámka:** `data` je surový výsledek `DB::raw` agregace (SUM), není stránkovaný. `total_points` může být `null` (ne `0`) u hráče bez jediného obodovaného tipu — ověřeno proti API, SQL `SUM()` přes samé `NULL` hodnoty vrací `NULL`.

---

## Statistiky hráčů (`/api/players`)

### `GET /api/players/{player}/stats`

- **Auth:** ano
- **Path parametry:** `player` – `hraci.h_id` (route model binding)
- **Query parametry:** `rocnik` (filtr na `t_rocnik`, bez něj počítá napříč všemi ročníky), `posledni` (kolik posledních obodovaných kol vrátit v `form`, výchozí `5`)
- **Request body:** žádný
- **Popis:** vše se počítá jen z tipů, které už mají vyplněný `t_body` (tedy `TipScoringService::scoreMatch()` už zápas obodoval) – kola/tipy čekající na výsledek se do žádného z čísel nepočítají.
- **Odpověď `200 OK`:**

```json
{
  "rocnik": "33",
  "player": { "h_id": 3, "h_nick": "honza" },
  "rounds_played": 12,
  "total_points": 34,
  "avg_points_per_round": 2.83,
  "form": [
    { "round": 8, "points": 1 },
    { "round": 9, "points": 5 },
    { "round": 10, "points": 0 },
    { "round": 11, "points": 6 },
    { "round": 12, "points": 3 }
  ],
  "accuracy": {
    "tips_scored": 12,
    "exact": 3,
    "exact_pct": 25.0,
    "outcome": 5,
    "outcome_pct": 41.7,
    "miss": 4,
    "miss_pct": 33.3
  }
}
```

- `form` je chronologicky od nejstaršího k nejnovějšímu kolu (pro vykreslení trendu), obsahuje `SUM(t_body)` za všechny tipy hráče v daném kole (jedno kolo může mít víc zápasů).
- `accuracy` rozděluje jednotlivé obodované tipy (ne kola) podle výsledku bodování v `TipScoringService`: `exact` = přesné skóre (`t_body === 5`), `outcome` = trefený výsledek bez přesného skóre (`t_body === 1`), `miss` = mimo (`t_body === 0`). `*_pct` jsou zaokrouhlené na 1 desetinné místo, `null` když `tips_scored === 0`. Pozor: pokud by se `t_body` v budoucnu počítalo i jinak (např. joker – viz `t_joker` v `TipResource`, `TipScoringService` ho zatím vůbec nepoužívá), součet `exact + outcome + miss` nemusí sedět na `tips_scored`.
- Hráč bez jediného obodovaného tipu v dané sezóně: `rounds_played` a `total_points` `0`, `avg_points_per_round` `null`, `form` `[]`, `accuracy` samé nuly/`null` procenta.

### `GET /api/players/h2h`

- **Auth:** ano
- **Query parametry:** `player1`, `player2` (oba povinné, `integer`, musí existovat v `hraci.h_id`, `player2` musí být jiné než `player1`), `rocnik` (nepovinné, bez něj napříč všemi ročníky)
- **Request body:** žádný
- **Popis:** srovnává jen zápasy, které oba hráči obodovaně otipovali (průnik podle `t_zapas`) – zápas otipovaný jen jedním z nich se do srovnání nepočítá.
- **Odpověď `200 OK`:**

```json
{
  "rocnik": "33",
  "player1": { "h_id": 3, "h_nick": "honza" },
  "player2": { "h_id": 7, "h_nick": "petr" },
  "matches_compared": 10,
  "wins": { "player1": 4, "player2": 3, "draws": 3 },
  "total_points": { "player1": 22, "player2": 19 }
}
```

- **Chybové odpovědi:** `422` při stejném ID pro `player1`/`player2`, chybějícím/neexistujícím hráči.

---

## Extra tipy (`/api/extra`, `/api/ExtraTip`)

**Typy extra sázek.** V DB tabulce `extra` fungují sloupce `e_zapas`/`e_muzstva` (oba `char(1)`, `"A"`/`"N"`) jako jeden exkluzivní přepínač typu, ne jako dva nezávislé příznaky — ověřeno přímo v datech (873 řádků `extra`, 7501 řádků `extratipy`). Aplikační vrstva to zapouzdřuje do `App\Enums\ExtraType` a navenek se typ zadává/čte jako `e_typ`:

| `e_typ` | `e_zapas`/`e_muzstva` | Co se sází | Skutečný výsledek | Tip hráče |
|---|---|---|---|---|
| `zapas` | `A`/`N` | skóre zápasu (např. "Slezský FC Opava - Fotbal Příbram") | `e_goly_d`/`e_goly_h` | `ex_tip_d`/`ex_tip_h` |
| `muzstvo` | `N`/`A` | konkrétní mužstvo (např. "kdo bude na 1. místě?") | `e_vysledek` = ID týmu (`muzstva.m_id`, jako string) | `ex_tip` = ID týmu (string) |
| `volna` | `N`/`N` | volná odpověď (text nebo číslo, např. "kolik gólů dá král střelců?") | `e_vysledek` = text/číslo | `ex_tip` = text/číslo |

Pole, která pro daný typ nedávají smysl, se ukládají prázdná — `e_goly_d`/`e_goly_h`/`e_vysledek` jako `NULL` (sloupce jsou nullable), `extratipy.ex_tip` jako `""` (sloupec je v DB `NOT NULL` bez defaultu, takže u typu `zapas` nese prázdný string, ne `NULL`).

**Bodování (`App\Services\ExtraScoringService`).** Spouští se automaticky při `PUT /api/extra/{extra}`, pokud má daný typ po update kompletní výsledek (`Extra::hasResult()`):

- `zapas`: přesné skóre → **4 body**; správný výsledek (výhra/remíza/prohra podle znaménka rozdílu gólů, stejná logika jako `TipScoringService`) → **1 bod**; jinak 0.
- `muzstvo`: přesná shoda ID týmu → **5 bodů**; jinak 0.
- `volna`: shoda textu po normalizaci (trim, sjednocení mezer, lowercase) → **4 body**; jinak 0. Normalizace je vědomá odchylka od legacy dat, kde se bodovala přesná shoda stringu (`"Sparta Praha"` vs `"sparta praha"` v legacy datech skórovalo různě) — nová logika stejné odpovědi v jiném zápisu skóruje stejně, sémanticky odlišné odpovědi pořád ne.

### `GET /api/extra`

- **Auth:** ano
- **Query parametry:** `rocnik` (filtr na `e_rocnik`), `page`
- **Request body:** žádný
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`, přes `App\Http\Resources\ExtraResource` — ne syrový model; skrývá `e_zapas`/`e_muzstva` za `e_typ` a u typu `muzstvo` dosazuje celý tým místo holého ID):

```json
{
  "data": [
    {
      "e_id": 1,
      "e_pril": "Vítěz ligy",
      "e_typ": "muzstvo",
      "e_goly_d": null,
      "e_goly_h": null,
      "e_vysledek": "3",
      "e_vysledek_tym": { "m_id": 3, "m_nazev": "SK Slavia Praha" },
      "e_rocnik": 33,
      "e_platnost": "A",
      "e_datum_pl": "2026-12-31T00:00:00.000000Z",
      "e_autor": 3,
      "tips": []
    }
  ]
}
```

`e_vysledek_tym` je `null` mimo typ `muzstvo`, nebo dokud výsledek není znám. `tips` je prázdné pole v `GET /api/extra` (relace se tu needitovatelně nenačítá), ale vyplní se v odpovědi `PUT /api/extra/{extra}` (viz níže).

**Poznámka k `e_datum_pl`:** stejně jako `date` u zápasů (viz výše) — cast `'e_datum_pl' => 'date'` se serializuje jako plný ISO timestamp, ne holé `YYYY-MM-DD`.

**Poznámka k `e_rocnik`:** stejně jako `z_rocnik`/`t_rocnik` — je to `rocniky.r_id`, ne kalendářní rok. Viz sekce Ročníky.

### `POST /api/extra`

- **Auth:** ano, **role: admin**
- **Request body** (`$request->validate([...])` v `ExtraController::store`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `e_pril` | string | ano | max 250 znaků |
| `e_typ` | string | ano | `zapas` / `muzstvo` / `volna` — viz tabulka typů výše |
| `e_goly_d` | integer, nullable | ne | jen pro `e_typ=zapas`; jinak ignorováno |
| `e_goly_h` | integer, nullable | ne | jen pro `e_typ=zapas`; jinak ignorováno |
| `e_vysledek_tym` | integer, nullable | ne | jen pro `e_typ=muzstvo`; `muzstva.m_id`; jinak ignorováno |
| `e_vysledek_text` | string, nullable | ne | jen pro `e_typ=volna`, max 250 znaků; jinak ignorováno |
| `e_rocnik` | integer | ano | `rocniky.r_id`, viz sekce Ročníky |
| `e_platnost` | string | ano | `A` nebo `N` |
| `e_datum_pl` | date, nullable | ne | – |

  `e_autor` (ID přihlášeného hráče) doplňuje controller automaticky. `e_typ` se překlopí na dvojici `e_zapas`/`e_muzstva` a výsledková pole mimo aktuální typ se vždy uloží prázdná (`NULL`) — výsledek se typicky doplňuje až později přes `PUT`, jakmile je znám.

- **Odpověď `201 Created`:** stejný tvar položky jako v `GET /api/extra`.

### `PUT /api/extra/{extra}`

- **Auth:** ano, **role: admin**
- **Path parametry:** `extra` – ID záznamu (`extra.e_id`), route model binding
- **Request body:** stejná pole jako u `POST /api/extra`, ale všechna `sometimes|required` (kromě nullable polí, která zůstávají `nullable`). `e_typ` lze i tady změnit (přepíná se tím `e_zapas`/`e_muzstva`).
- **Výsledková pole** (`e_goly_d`/`e_goly_h`/`e_vysledek_tym`/`e_vysledek_text`) se přepíší **jen** když je request explicitně pošle (nebo mění `e_typ`) — jinak dílčí update (např. jen `e_platnost`) výsledek nevynuluje.
- Po uložení se, pokud má daný typ kompletní výsledek, spustí `ExtraScoringService::scoreExtra()` a přepočítá `ex_body` u všech `ExtraTip` navázaných na tuto `extra`.
- **Odpověď `200 OK`:** tvar položky jako v `GET /api/extra`, navíc s `tips` (vč. přepočítaného `ex_body` u každého tipu).

### `DELETE /api/extra/{extra}`

- **Auth:** ano, **role: admin**
- **Path parametry:** `extra` – ID záznamu, route model binding
- **Odpověď `200 OK`:** `{"message": "Extra byla úspěšně smazána."}`

### `GET /api/ExtraTip`

- **Auth:** ano
- **Path:** pozor, cesta je case-sensitive přesně `api/ExtraTip` (ne `api/extratip`), viz `routes.json`.
- **Query parametry:** `rocnik` (filtr na `ex_rocnik`), `page`
- **Request body:** žádný
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`, přes `App\Http\Resources\ExtraTipResource` — ne syrový model; u tipu na `extra` typu `muzstvo` dosazuje celý tým místo holého ID):

```json
{
  "data": [
    {
      "ex_id": 1,
      "ex_extra": 1,
      "ex_hrac": 3,
      "ex_tip": "",
      "ex_tip_d": 2,
      "ex_tip_h": 1,
      "ex_tip_tym": null,
      "ex_body": 4,
      "ex_datum": "2026-08-20",
      "ex_rocnik": 33
    }
  ]
}
```

U tipu na `extra` typu `muzstvo` je `ex_tip` pořád holé ID týmu (string, jak se ukládá do DB) a `ex_tip_tym` navíc nese `{"m_id": ..., "m_nazev": ...}` — `null`, pokud tým s daným ID neexistuje. `ex_body` je `null`, dokud `ExtraScoringService` daný `extra` nedobodoval (viz `PUT /api/extra/{extra}` výše).

### `POST /api/ExtraTip`

- **Auth:** ano (žádná specifická role — hráč zadává vlastní tip, stejně jako u `/api/tips`)
- **Request body** (`$request->validate([...])` v `ExtraTipController::store`), pole závisí na typu cílové `extra` (`Extra::type()`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `ex_extra` | integer | ano | musí existovat v `extra.e_id`; určuje typ tipu |
| `ex_rocnik` | integer | ano | – |
| `ex_tip_d` | integer, nullable | ano, jen pro typ `zapas` | – |
| `ex_tip_h` | integer, nullable | ano, jen pro typ `zapas` | – |
| `ex_tip_tym` | integer, nullable | ano, jen pro typ `muzstvo` | `muzstva.m_id` |
| `ex_tip_text` | string, nullable | ano, jen pro typ `volna` | max 250 znaků |

  `ex_hrac` (ID přihlášeného hráče) a `ex_datum` (teď) doplňuje controller automaticky. Pole mimo typ cílové `extra` se ignorují a uloží prázdná (`ex_tip_d`/`ex_tip_h` = `NULL`, `ex_tip` = `""` u typu `zapas`, jinak nese hodnotu podle typu).

- **Odpověď `201 Created`:** tvar položky jako v `GET /api/ExtraTip` (`ex_body` zatím `null`, dokud není `extra` obodovaná).

### `PUT /api/ExtraTip/{id}`

- **Auth:** ano — jen vlastník tipu (`ex_hrac === přihlášený hráč`), jinak `403`
- **Path parametry:** `id` – `extratipy.ex_id` (obyčejné `findOrFail`, ne route model binding)
- **Request body:** stejná pole jako u `POST /api/ExtraTip` kromě `ex_extra` (typ tipu se needitovatelně odvozuje z existující `extra`), všechna volitelná — mění se jen to, co request pošle.
- **Odpověď `200 OK`:** tvar položky jako v `GET /api/ExtraTip`.

### `DELETE /api/ExtraTip/{id}`

- **Auth:** ano — jen vlastník tipu, jinak `403`
- **Path parametry:** `id` – `extratipy.ex_id`
- **Odpověď `200 OK`:** `{"message": "Tip byl úspěšně smazán."}`
