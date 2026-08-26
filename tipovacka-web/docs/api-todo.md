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

## ~~`GET /api/myTips` vrací jen syrový tip, ne detail zápasu~~ — vyřešeno

- **Cesta/metoda:** `GET /api/myTips`, `GET /api/tips`
- **Stav:** `TipsController::index`/`myTips`/`store`/`update` teď vrací přes nový `App\Http\Resources\TipResource`, eager-loadovaný s `match.homeTeam`/`match.awayTeam` — položka nese `home_team`/`away_team`/`date` (stejná pojmenování jako `MatchResource`), ne jen holé `t_zapas`. Viz `docs/api.md`, sekce Tipy, v `tipovacka-api`.
- **Dopad na frontend:** `src/pages/MojeTipy` teď může zobrazit soupeře a datum místo "Zápas č. <ID>" — je potřeba upravit `Tip` typ v `src/api/types.ts` (přidat `home_team`/`away_team`/`date`) a `MojeTipy.tsx` (sloupec "Zápas č." nahradit soupeři), a smazat tuhle poznámku pod tabulkou.
