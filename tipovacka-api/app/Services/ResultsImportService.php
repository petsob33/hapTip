<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Rocnik;
use App\Support\TeamNameMatcher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Stáhne výsledky z API-Football a napáruje je na interní zápasy (`zapasy`)
 * podle jmen týmů + data — API-Football má vlastní ID týmů a čísluje kola
 * jinak, takže žádný spolehlivý cizí klíč mezi zdroji neexistuje. `preview()`
 * nic nezapisuje, `apply()` zapisuje jen zápasy, které admin potvrdil.
 */
class ResultsImportService
{
    // FT = normální konec, AET = prodloužení, PEN = penalty rozstřel —
    // viz API-Football dokumentace `fixture.status.short`.
    private const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

    // Zápas se páruje jen s fixture ve stejný den ± tento rozsah (kickoff čas
    // v interních datech je vždy půlnoc, viz MatchResource poznámka o z_datum
    // v docs/api.md).
    private const MAX_DATE_DIFF_DAYS = 2;

    // Minimální shoda normalizovaných jmen týmů (0-100, `similar_text()`),
    // pod kterou pár nepovažujeme za spolehlivý a necháme na adminovi.
    private const MIN_NAME_MATCH_PERCENT = 55.0;

    public function __construct(
        private readonly FootballApiClient $client,
        private readonly MatchService $matchService,
        private readonly TipScoringService $scoringService,
    ) {}

    /**
     * @return array{matched: array<int, array<string, mixed>>, unmatched: array<int, array<string, mixed>>}
     */
    public function preview(Rocnik $rocnik): array
    {
        [$leagueId, $season] = $this->resolveExternalLeagueAndSeason($rocnik);

        $fixtures = collect($this->client->fixtures($leagueId, $season))
            ->filter(fn (array $f) => in_array($f['fixture']['status']['short'] ?? null, self::FINISHED_STATUSES, true))
            ->values();

        // Jen zápasy, které ještě nemají oba góly vyplněné — import
        // nepřepisuje ručně zadané/opravené výsledky.
        $matches = GameMatch::with(['homeTeam', 'awayTeam'])
            ->where('z_rocnik', $rocnik->r_id)
            ->where(function ($query) {
                $query->whereNull('z_goly_d')->orWhereNull('z_goly_h');
            })
            ->orderBy('z_kolo')
            ->orderBy('z_datum')
            ->get();

        $usedFixtureIndexes = [];
        $matched = [];
        $unmatched = [];

        foreach ($matches as $match) {
            $best = $this->bestFixtureFor($match, $fixtures, $usedFixtureIndexes);

            if ($best === null) {
                $unmatched[] = [
                    'match_id' => $match->z_id,
                    'round' => $match->z_kolo,
                    'home_team' => $match->homeTeam?->m_nazev,
                    'away_team' => $match->awayTeam?->m_nazev,
                    'date' => optional($match->z_datum)->toDateString(),
                ];

                continue;
            }

            [$index, $fixture, $score] = $best;
            $usedFixtureIndexes[$index] = true;

            $matched[] = [
                'match_id' => $match->z_id,
                'round' => $match->z_kolo,
                'home_team' => $match->homeTeam?->m_nazev,
                'away_team' => $match->awayTeam?->m_nazev,
                'date' => optional($match->z_datum)->toDateString(),
                'current_home_goals' => $match->z_goly_d,
                'current_away_goals' => $match->z_goly_h,
                'proposed_home_goals' => $fixture['goals']['home'] ?? null,
                'proposed_away_goals' => $fixture['goals']['away'] ?? null,
                'external_fixture_id' => $fixture['fixture']['id'] ?? null,
                'match_confidence' => round($score, 1),
            ];
        }

        return ['matched' => $matched, 'unmatched' => $unmatched];
    }

    /**
     * Znovu natáhne fixtures (preview se mezi kroky neukládá) a zapíše góly
     * jen pro `$matchIds`, které se v aktuálním návrhu skutečně napárovaly.
     * Po zápisu spustí `TipScoringService::scoreMatch()`, stejně jako ruční
     * `PUT /matches/{match}` v MatchController.
     *
     * @param  array<int, int>  $matchIds
     * @return array{updated: array<int, int>}
     */
    public function apply(Rocnik $rocnik, array $matchIds): array
    {
        $proposals = collect($this->preview($rocnik)['matched'])
            ->keyBy('match_id')
            ->only($matchIds)
            ->filter(fn (array $p) => $p['proposed_home_goals'] !== null && $p['proposed_away_goals'] !== null);

        $matches = GameMatch::whereIn('z_id', $proposals->keys())->get()->keyBy('z_id');

        $updated = [];

        foreach ($proposals as $matchId => $proposal) {
            $match = $matches->get($matchId);

            if ($match === null) {
                continue;
            }

            $match = $this->matchService->update($match, [
                'z_goly_d' => $proposal['proposed_home_goals'],
                'z_goly_h' => $proposal['proposed_away_goals'],
            ]);

            $this->scoringService->scoreMatch($match);

            $updated[] = $match->z_id;
        }

        return ['updated' => $updated];
    }

    /**
     * @return array{0: int, 1: int} [externí league ID, sezóna jako rok]
     */
    private function resolveExternalLeagueAndSeason(Rocnik $rocnik): array
    {
        $leagueId = config("services.football_api.leagues.{$rocnik->r_liga}");

        if (! $leagueId) {
            throw new RuntimeException("Pro ligu č. {$rocnik->r_liga} není nastavené externí ID API-Football (FOOTBALL_API_LEAGUE_ID_{$rocnik->r_liga} v .env).");
        }

        if (! preg_match('/(\d{4})/', (string) $rocnik->r_rocnik, $m)) {
            throw new RuntimeException("Ze značky ročníku \"{$rocnik->r_rocnik}\" nejde určit rok sezóny pro API-Football.");
        }

        return [(int) $leagueId, (int) $m[1]];
    }

    /**
     * @param  array<int, bool>  $usedFixtureIndexes
     * @return array{0: int, 1: array<string, mixed>, 2: float}|null [index ve $fixtures, fixture, shoda 0-100]
     */
    private function bestFixtureFor(GameMatch $match, Collection $fixtures, array $usedFixtureIndexes): ?array
    {
        $home = $match->homeTeam?->m_nazev ?? '';
        $away = $match->awayTeam?->m_nazev ?? '';
        $matchDate = $match->z_datum;

        $best = null;

        foreach ($fixtures as $index => $fixture) {
            if (isset($usedFixtureIndexes[$index]) || $matchDate === null) {
                continue;
            }

            $fixtureDate = Carbon::parse($fixture['fixture']['date'] ?? null);

            if (abs($matchDate->diffInDays($fixtureDate, false)) > self::MAX_DATE_DIFF_DAYS) {
                continue;
            }

            $homePercent = TeamNameMatcher::similarity($home, $fixture['teams']['home']['name'] ?? '');
            $awayPercent = TeamNameMatcher::similarity($away, $fixture['teams']['away']['name'] ?? '');

            // Obě strany musí projít prahem samostatně — jinak by silná shoda
            // domácího týmu mohla přehlušit slabou/žádnou shodu hostů a
            // spárovat zápas se špatným fixture.
            if ($homePercent < self::MIN_NAME_MATCH_PERCENT || $awayPercent < self::MIN_NAME_MATCH_PERCENT) {
                continue;
            }

            $score = ($homePercent + $awayPercent) / 2;

            if ($best === null || $score > $best[2]) {
                $best = [$index, $fixture, $score];
            }
        }

        return $best;
    }
}
