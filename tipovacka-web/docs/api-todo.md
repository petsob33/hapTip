# API TODO

Věci, které frontend potřebuje, ale API buď nemá, nebo je má rozbité. Viz CLAUDE.md.

## `DELETE /api/matches` — nepoužitelné, chybí `{id}` v routě

- **Cesta/metoda:** `DELETE /api/matches` (admin)
- **Problém:** `MatchController::destroy(Request $request, $id)` vyžaduje `$id`, ale routa v `routes/api.php`/`routes.json` žádný `{id}` parametr nemá (na rozdíl od `PUT /api/matches/{match}`). Podrobně viz `docs/api.md`, sekce Zápasy.
- **Dopad na frontend:** Admin sekce Zápasy (`src/pages/AdminMatches`) proto mazání zápasů vůbec nenabízí — jen vytvoření a úpravu (termín, kolo, ročník, výsledek).
- **Co by bylo potřeba:** opravit routu na `DELETE /api/matches/{match}` (route model binding jako u update), pak doplnit `useDeleteMatch` hook a tlačítko "Smazat" v `MatchesTable`.

## `MatchResource` nevrací ID týmů, jen jejich název

- **Cesta/metoda:** `GET /api/matches`, `GET /api/untipped` (`MatchResource`)
- **Problém:** odpověď obsahuje `home_team`/`away_team` jako string (název), ne `z_domaci`/`z_hoste` (ID). Při editaci existujícího zápasu tak nejde předvyplnit select týmu jeho aktuální hodnotou.
- **Dopad na frontend:** `MatchEditForm` (`src/pages/AdminMatches`) proto neumožňuje měnit domácí/hostující tým existujícího zápasu — jen při vytváření nového.
- **Co by bylo potřeba:** přidat do `MatchResource::toArray()` `home_team_id` / `away_team_id` (případně vnořený objekt týmu s `id`).

## `GET /api/team` nemá vyhledávání ani "vrať vše bez stránkování"

- **Cesta/metoda:** `GET /api/team`
- **Problém:** vždy vrací jen `paginate(10)`, bez parametru pro vypnutí stránkování nebo filtrování podle názvu.
- **Dopad na frontend:** `useAllTeams` (`src/api/hooks/useTeams.ts`) kvůli tomu natahuje všechny stránky najednou (aktuálně ~100 týmů = 10 requestů), aby šlo naplnit select domácí/hostující tým v `MatchCreateForm`. Při větším počtu týmů by to přestalo být praktické.
- **Co by bylo potřeba:** query parametr pro vyhledávání (např. `?q=`) nebo `?per_page=` / `?all=1`.

## Chybí endpoint pro historii vzájemných zápasů (H2H)

- **Cesta/metoda:** neexistuje, potřeba např. `GET /api/matches/{match}/h2h`
- **Problém:** API neumí vrátit předchozí vzájemné zápasy dvou týmů. `MatchResource` navíc nevrací ID týmů (viz záznam výše), takže endpoint musí dvojici týmů dohledat sám podle `match.z_domaci`/`z_hoste`, ne podle ID poslaných z frontendu.
- **Dopad na frontend:** Obrazovka Zápasy (`src/pages/Zapasy/UntippedMatchRow.tsx`) u tipovaného zápasu zobrazuje dosavadní vzájemnou bilanci obou týmů — `useH2H` (`src/api/hooks/useH2H.ts`) to teď dopočítává z `GET /matches?rocnik=` (jen zápasy stejné sezóny jako tipovaný zápas), ne z mocku. Bez dedikovaného endpointu to ale nejde napříč sezónami.
- **Co by bylo potřeba:** endpoint, který pro dané `z_id` najde odehrané zápasy (`z_goly_d`/`z_goly_h` not null) mezi stejnou dvojicí týmů (v obou pořadích domácí/hosté), seřazené od nejnovějšího, např. posledních 5. Odpověď ve tvaru `{ data: [{ id, date, home_team, away_team, home_goals, away_goals, season }] }` — stejné pojmenování polí jako `MatchResource`.

## `GET /api/matches?rocnik=` řadí podle data, ne podle kola

- **Cesta/metoda:** `GET /api/matches?rocnik=` (`MatchController::index`)
- **Problém:** s filtrem `rocnik` je řazení pevně `orderByDesc('z_datum')` — nejde přepnout na řazení podle `z_kolo`, a protože je to zároveň stránkované (`per_page`), řazení podle kola nejde bezpečně dodělat jen na jedné stránce.
- **Dopad na frontend:** `src/pages/MojeTipy/MojeTipy.tsx` proto místo `useMatches` (stránkované `/matches`) používá nový `useSeasonMatches` (`src/api/hooks/useMatches.ts`) — natáhne celou sezónu najednou (`per_page=500`) a řadí/stránkuje podle kola na frontendu.
- **Co by bylo potřeba:** query parametr pro řazení (např. `?sort=kolo`), nebo rovnou default řazení podle `z_kolo` (asc), `z_datum` jako sekundární klíč.

## Fotka hráče (`h_foto`) dostupná jen pro vlastní profil

- **Cesta/metoda:** `GET /api/user` (vlastní), ale ne `GET /api/tips`, `GET /api/myTips`, `GET /api/leadboard` (`h_foto` u cizích hráčů nikde)
- **Problém:** stejná situace jako u e-mailu/admin příznaku — API nemá endpoint na detail cizího hráče, takže `h_foto` (a tedy fotku) lze zobrazit jen na vlastním profilu.
- **Dopad na frontend:** `src/pages/Profil/Profil.tsx` fotku zobrazuje jen když `isOwnProfile`; u cizích profilů zůstávají iniciály (stejný fallback jako při chybějícím/nenačteném souboru).
- **Co by bylo potřeba:** buď endpoint na detail hráče podle ID, nebo přidat `h_foto`/`h_nick` do `TipResource`/`LeaderboardEntry` (tam už `h_nick` je, `h_foto` chybí).

## ~~`GET /api/myTips` vrací jen syrový tip, ne detail zápasu~~ — vyřešeno

- **Cesta/metoda:** `GET /api/myTips`, `GET /api/tips`
- **Stav:** `TipsController::index`/`myTips`/`store`/`update` teď vrací přes nový `App\Http\Resources\TipResource`, eager-loadovaný s `match.homeTeam`/`match.awayTeam` — položka nese `home_team`/`away_team`/`date` (stejná pojmenování jako `MatchResource`), ne jen holé `t_zapas`. Viz `docs/api.md`, sekce Tipy, v `tipovacka-api`.
- **Dopad na frontend:** `src/pages/MojeTipy` teď může zobrazit soupeře a datum místo "Zápas č. <ID>" — je potřeba upravit `Tip` typ v `src/api/types.ts` (přidat `home_team`/`away_team`/`date`) a `MojeTipy.tsx` (sloupec "Zápas č." nahradit soupeři), a smazat tuhle poznámku pod tabulkou.
