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
- **Query parametry:**
  - `page` (stránkování, `paginate($per_page)`)
  - `per_page` (nepovinné, výchozí `10`) — pro načtení všech zápasů sezóny najednou (např. pro seskupení podle kola na frontendu)
  - `rocnik` (nepovinné, filtr na `z_rocnik` = `rocniky.r_id`, viz sekce Ročníky). Bez něj se vrací všechny zápasy napříč sezónami, řazené sestupně podle `z_id` (chování beze změny — používá to admin výpis). **S** `rocnik` se řadí vzestupně podle `z_datum` (chronologicky).
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
      "away_goals": null,
      "my_tip": {
        "t_id": 42,
        "t_tip_d": 2,
        "t_tip_h": 1,
        "t_body": null
      }
    }
  ]
}
```
(plus stránkovací `links`/`meta`, viz sekce Stránkování výše)

**`season` = `rocniky.r_id`, ne kalendářní rok** — viz sekce Ročníky výše.

**Poznámka k `date`:** ověřeno proti běžícímu API — i když `GameMatch` má cast `'z_datum' => 'date'`, do JSON se serializuje jako plný ISO timestamp (`...T00:00:00.000000Z`), ne jako holé `YYYY-MM-DD`. Model nepřepisuje `serializeDate()`, takže se použije výchozí Carbon serializace.

**Poznámka k `my_tip`:** vlastní tip přihlášeného hráče na daný zápas, nebo `null`, pokud ho ještě nezadal. Vyplněné je to jen na tomto endpointu (`MatchController::index` eager loaduje `tips` omezené na `t_hrac = aktuální uživatel`) — na `POST`/`PUT /api/matches` a `GET /api/untipped` je `my_tip` vždy `null` (poslední jmenovaný z definice vrací jen zápasy bez tipu).

### `GET /api/untipped`

- **Auth:** ano
- **Query parametry:**
  - `page` (stránkování, `paginate($per_page)`)
  - `per_page` (nepovinné, výchozí `10`) — počet položek na stránku; použij vyšší hodnotu pro načtení všech netipovaných zápasů najednou (potřeba pro seskupení podle kola na frontendu).
- **Request body:** žádný
- **Popis:** vrací nadcházející zápasy (`z_datum > now()`), na které přihlášený hráč ještě nemá vlastní tip, řazené vzestupně podle `z_kolo`, v rámci kola podle `z_datum`.
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

---

## Tipy (`/api/tips`, `/api/myTips`)

Tyto endpointy vrací `App\Http\Resources\TipResource` (dřív popsáno jako "syrový model" —
opraveno, `TipsController` vždy volal `TipResource::collection(...)`, jen se tvar odpovědi
zapomněl zaktualizovat zde po přidání `home_team`/`away_team`/`date`).

### `GET /api/tips`

- **Auth:** ano
- **Query parametry:**
  - `rocnik` (filtr na `t_rocnik`)
  - `page`
  - `per_page` (nepovinné, výchozí `10`) — pro načtení všech tipů sezóny najednou (potřeba pro
    seskupení podle kola/zápasu na frontendu, stejně jako u `GET /api/untipped`)
- **Request body:** žádný
- **Popis:** vrací tipy **všech hráčů** (není omezeno na přihlášeného uživatele), řazené sestupně podle `t_datum`.
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`):

```json
{
  "data": [
    {
      "t_id": 1,
      "t_zapas": 10,
      "home_team": "FC Příklad",
      "away_team": "SK Test",
      "date": "2026-08-30T00:00:00.000000Z",
      "round": 5,
      "t_hrac": 3,
      "h_nick": "Pavel",
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

`home_team`/`away_team`/`date`/`round` jsou stejná pojmenování jako `MatchResource` (`round` = `zapasy.z_kolo`), `h_nick` je přezdívka hráče (`hraci.h_nick`, přes `t_hrac`) — stejné pojmenování jako `LeaderboardEntry.h_nick`.

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

### `PUT /api/tips/{id}`

- **Auth:** ano
- **Path parametry:** `id` – `tipy.t_id`
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

**Oprava (dřív TODO zde):** routa dřív byla `PUT /api/tips` bez `{id}`, zatímco `TipsController::update(Request $request, $id)` `$id` vyžadoval — volání vždy skončilo `500 ArgumentCountError` (ověřeno). Opraveno na `PUT /api/tips/{id}` s route parametrem.

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

### `GET /api/leadboard/podiums`

- **Auth:** ano
- **Query parametry:** žádné — počítá přes VŠECHNY ročníky najednou
- **Request body:** žádný
- **Odpověď `200 OK`:**

```json
{
  "data": [
    {
      "h_nick": "honza",
      "first": 3,
      "second": 1,
      "third": 0
    }
  ]
}
```

- **Poznámka:** `first`/`second`/`third` = kolikrát byl hráč na 1./2./3. místě žebříčku (`GET /api/leadboard`) napříč všemi ročníky z `GET /api/rocniky`. Nahrazuje frontendový vzor "zavolej `/leadboard` pro každý ročník zvlášť" — s desítkami ročníků to byly desítky paralelních requestů na stránce Žebříček a proti `php artisan serve` (single-threaded bez `PHP_CLI_SERVER_WORKERS`) to viditelně brzdilo načtení. Hráči bez umístění (sezóna bez obodovaného tipu) v odpovědi nefigurují.

---

## Statistiky hráčů (`/api/players/{player}/stats`, `/api/players/h2h`)

Nové endpointy (`App\Http\Controllers\PlayerStatsController`), nejsou přes Resource — vrací syrové pole.

### `GET /api/players/{player}/stats`

- **Auth:** ano (žádná specifická role)
- **Path parametry:** `player` – ID hráče (`hraci.h_id`), route model binding
- **Query parametry:**
  - `rocnik` (nepovinné, filtr na `t_rocnik` = `rocniky.r_id`, viz sekce Ročníky; bez něj se počítá přes všechny ročníky hráče)
  - `posledni` (nepovinné, výchozí `5`) — kolik posledních kol vrátit v `form`
- **Request body:** žádný
- **Popis:** `rounds_played`/`total_points`/`avg_points_per_round`/`form` se počítají jen z kol (`zapasy.z_kolo`), kde má hráč aspoň jeden obodovaný tip (`t_body IS NOT NULL`) — nedokončená kola (zápasy bez výsledku) průměr nezkreslují. `accuracy` počítá stejně, ale po jednotlivých tipech, ne po kolech.
- **Odpověď `200 OK`:**

```json
{
  "rocnik": "33",
  "player": { "h_id": 3, "h_nick": "honza" },
  "rounds_played": 12,
  "total_points": 54,
  "avg_points_per_round": 4.5,
  "form": [
    { "round": 8, "points": 6 },
    { "round": 9, "points": 3 },
    { "round": 10, "points": 9 }
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

- **Poznámka k `form`:** posledních `posledni` kol, seřazeno chronologicky vzestupně (nejstarší → nejnovější), pro vykreslení trendu/sparkline.
- **Poznámka k `avg_points_per_round`:** `null`, pokud `rounds_played` je `0` (hráč nemá v daném ročníku žádný obodovaný tip).
- **Poznámka k `accuracy`:** rozklad podle bodování v `TipScoringService` — `exact` = přesné skóre (`t_body === 5`), `outcome` = trefený výsledek (výhra/remíza/prohra) bez přesného skóre (`t_body === 1`), `miss` = mimo (`t_body === 0`). `*_pct` zaokrouhlené na 1 desetinné místo, `null` když `tips_scored === 0`. Joker (`t_joker` v `TipResource`) do bodování zatím vůbec nevstupuje, takže tady se nijak neprojeví.

### `GET /api/players/h2h`

- **Auth:** ano (žádná specifická role)
- **Query parametry:**

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `player1` | integer | ano | existuje v `hraci.h_id` |
| `player2` | integer | ano | existuje v `hraci.h_id`, různé od `player1` |
| `rocnik` | integer | ne | `rocniky.r_id`, viz sekce Ročníky; bez něj se srovnává přes všechny ročníky |

- **Request body:** žádný
- **Popis:** srovnává oba hráče jen na zápasech, které **oba** obodovaně otipovali (`t_body IS NOT NULL` u obou) — zápas otipovaný jen jedním z nich se do srovnání nepočítá. `wins.player1`/`wins.player2` = počet zápasů, kde měl daný hráč víc bodů než soupeř, `draws` = shodný počet bodů.
- **Odpověď `200 OK`:**

```json
{
  "rocnik": "33",
  "player1": { "h_id": 3, "h_nick": "honza" },
  "player2": { "h_id": 5, "h_nick": "petr" },
  "matches_compared": 12,
  "wins": { "player1": 5, "player2": 4, "draws": 3 },
  "total_points": { "player1": 60, "player2": 55 }
}
```

- **Odpověď `422 Unprocessable Entity`:** standardní tvar (viz sekce Chybové odpovědi), pokud `player1`/`player2` chybí, neexistují, nebo jsou stejné.

---

## Extra tipy (`/api/extra`, `/api/ExtraTip`)

### `GET /api/extra`

- **Auth:** ano
- **Query parametry:** `rocnik` (filtr na `e_rocnik`), `page`
- **Request body:** žádný
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`, syrový model `App\Models\Extra`, tabulka `extra`):

```json
{
  "data": [
    {
      "e_id": 1,
      "e_pril": "Vítěz ligy",
      "e_vysledek": null,
      "e_goly_d": null,
      "e_goly_h": null,
      "e_zapas": "N",
      "e_muzstva": "A",
      "e_rocnik": 33,
      "e_platnost": "A",
      "e_datum_pl": "2026-12-31T00:00:00.000000Z",
      "e_autor": 3
    }
  ]
}
```

**Poznámka k `e_datum_pl`:** stejně jako `date` u zápasů (viz výše) — cast `'e_datum_pl' => 'date'` se serializuje jako plný ISO timestamp, ne holé `YYYY-MM-DD`.

**Poznámka k `e_rocnik`:** stejně jako `z_rocnik`/`t_rocnik` — je to `rocniky.r_id`, ne kalendářní rok. Viz sekce Ročníky.

**Poznámka k `my_tip`:** `GET /api/extra` navíc vrací `my_tip` — vlastní tip přihlášeného hráče na tuto extra otázku (nebo `null`, pokud ještě netipoval). Tvar stejný jako u `POST/PUT /api/ExtraTip`, viz níže, jen bez `ex_extra`/`ex_hrac`/`ex_datum`/`ex_rocnik`:

```json
{
  "ex_id": 5,
  "ex_tip": null,
  "ex_tip_d": 2,
  "ex_tip_h": 1,
  "ex_tip_tym": null,
  "ex_body": null
}
```

### `POST /api/extra`

- **Auth:** ano, **role: admin**
- **Request body** (`$request->validate([...])` v `ExtraController::store`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `e_pril` | string | ano | max 250 znaků |
| `e_typ` | string | ano | `zapas` \| `muzstvo` \| `volna` (enum `App\Enums\ExtraType`) |
| `e_goly_d` | integer, nullable | ne | jen pro `e_typ=zapas` |
| `e_goly_h` | integer, nullable | ne | jen pro `e_typ=zapas` |
| `e_vysledek_tym` | integer, nullable | ne | jen pro `e_typ=muzstvo` — `muzstva.m_id` |
| `e_vysledek_text` | string, nullable | ne | jen pro `e_typ=volna`, max 250 znaků |
| `e_rocnik` | integer | ano | `rocniky.r_id`, viz sekce Ročníky |
| `e_platnost` | string | ano | `A` nebo `N` |
| `e_datum_pl` | date, nullable | ne | – |

  `e_autor` (ID přihlášeného hráče) doplňuje controller automaticky. Legacy sloupce `e_zapas`/`e_muzstva` (dvojice A/N přepínačů) controller nepřijímá — odvozuje je z `e_typ` (`ExtraType::toFlags()`).

- **Odpověď `201 Created`:** stejný tvar položky jako v `GET /api/extra` (bez `my_tip`, protože store/update relaci `tips` neloaduje).

### `PUT /api/extra/{extra}`

- **Auth:** ano, **role: admin**
- **Path parametry:** `extra` – ID záznamu (`extra.e_id`), route model binding
- **Request body:** stejná pole jako u `POST /api/extra`, ale všechna `sometimes|required` (kromě nullable polí, která zůstávají `nullable`). Výsledková pole (`e_goly_d/h`, `e_vysledek_tym`/`e_vysledek_text`) se přepisují jen když se mění `e_typ` nebo je aspoň jedno z nich v požadavku — jinak zůstávají beze změny.
- **Odpověď `200 OK`:** stejný tvar položky jako v `GET /api/extra`.

### `DELETE /api/extra/{extra}`

- **Auth:** ano, **role: admin**
- **Path parametry:** `extra` – ID záznamu, route model binding
- **Odpověď `200 OK`:** `{"message": "Extra byla úspěšně smazána."}`

### `GET /api/ExtraTip`

- **Auth:** ano
- **Path:** pozor, cesta je case-sensitive přesně `api/ExtraTip` (ne `api/extratip`), viz `routes.json`.
- **Query parametry:** `rocnik` (filtr na `ex_rocnik`), `page`
- **Request body:** žádný
- **Pozor:** nefiltruje podle přihlášeného hráče — vrací tipy všech hráčů pro daný ročník. Pro "můj tip" na konkrétní extra otázku použij `my_tip` z `GET /api/extra` (viz výše), ne tenhle endpoint.
- **Odpověď `200 OK`** (stránkovaný výsledek, položka `data[]`, resource `App\Http\Resources\ExtraTipResource` nad tabulkou `extratipy`):

```json
{
  "data": [
    {
      "ex_id": 1,
      "ex_extra": 1,
      "ex_hrac": 3,
      "ex_tip": null,
      "ex_tip_d": 2,
      "ex_tip_h": 1,
      "ex_tip_tym": null,
      "ex_body": null,
      "ex_datum": "2026-08-20",
      "ex_rocnik": 33
    }
  ]
}
```

**Poznámka k `ex_tip_tym`:** stejně jako `e_vysledek_tym` u `GET /api/extra` — jen pro extra typu `muzstvo`, kde `ex_tip` nese ID týmu; sem se přidá celý tým (`{"m_id": ..., "m_nazev": ...}`).

### `POST /api/ExtraTip`

- **Auth:** ano
- **Request body** (`$request->validate([...])` v `ExtraTipController::store`, pravidla se liší podle typu extra otázky určené přes `ex_extra`):

| Pole | Typ | Povinné | Pravidla |
|---|---|---|---|
| `ex_extra` | integer | ano | `extra.e_id` |
| `ex_rocnik` | integer | ano | – |
| `ex_tip_d` | integer, nullable | jen pro extra s `e_typ=zapas` | min 0 |
| `ex_tip_h` | integer, nullable | jen pro extra s `e_typ=zapas` | min 0 |
| `ex_tip_tym` | integer, nullable | jen pro extra s `e_typ=muzstvo` | `muzstva.m_id` |
| `ex_tip_text` | string, nullable | jen pro extra s `e_typ=volna` | max 250 znaků |

  `ex_hrac` (ID přihlášeného hráče) a `ex_datum` (teď) doplňuje controller automaticky.

- **Odpověď `201 Created`:** stejný tvar položky jako v `GET /api/ExtraTip`.

### `PUT /api/ExtraTip/{id}`

- **Auth:** ano — jen vlastník tipu (`ex_hrac`), jinak `403`
- **Path parametry:** `id` – `extratipy.ex_id`
- **Request body:** stejná pole jako u `POST /api/ExtraTip` kromě `ex_extra` (typ extra otázky se u existujícího tipu nemění), všechna `sometimes`.
- **Odpověď `200 OK`:** stejný tvar položky jako v `GET /api/ExtraTip`.

### `DELETE /api/ExtraTip/{id}`

- **Auth:** ano — jen vlastník tipu (`ex_hrac`), jinak `403`
- **Path parametry:** `id` – `extratipy.ex_id`
- **Odpověď `200 OK`:** `{"message": "Tip byl úspěšně smazán."}`
