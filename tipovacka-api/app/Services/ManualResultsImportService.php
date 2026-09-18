<?php

namespace App\Services;

use App\Models\GameMatch;
use App\Models\Rocnik;
use App\Support\TeamNameMatcher;

/**
 * Alternativa k ResultsImportService bez závislosti na externím API — admin
 * vloží výsledky jako prostý text (jeden zápas na řádek, "Domácí - Hosté
 * 2:1") a appka je napáruje na zápasy v ročníku, kterým ještě chybí výsledek,
 * podle jmen týmů. Bez data zápasu v textu se páruje jen podle dvojice týmů
 * (v rámci ročníku je dvojice domácí/hosté jednoznačná), ne podle dne.
 */
class ManualResultsImportService
{
    // Minimální shoda normalizovaných jmen týmů (0-100, viz TeamNameMatcher),
    // pod kterou pár nepovažujeme za spolehlivý a necháme na adminovi.
    private const MIN_NAME_MATCH_PERCENT = 55.0;

    // "Sparta - Slavia 2:1" / "Sparta – Slavia 2 : 1" / "Sparta vs Slavia 2:1".
    // Skóre záměrně jen s ":" (ne "-"), aby nekolidovalo s oddělovačem týmů.
    private const LINE_PATTERN = '/^(.+?)\s*(?:-|–|vs\.?)\s*(.+?)\s+(\d+)\s*:\s*(\d+)\s*$/iu';

    public function __construct(
        private readonly MatchService $matchService,
        private readonly TipScoringService $scoringService,
    ) {}

    /**
     * @return array{matched: array<int, array<string, mixed>>, unmatched: array<int, array<string, mixed>>, parse_errors: array<int, array<string, mixed>>}
     */
    public function preview(Rocnik $rocnik, string $text): array
    {
        [$rows, $parseErrors] = $this->parse($text);

        $matches = GameMatch::with(['homeTeam', 'awayTeam'])
            ->where('z_rocnik', $rocnik->r_id)
            ->where(function ($query) {
                $query->whereNull('z_goly_d')->orWhereNull('z_goly_h');
            })
            ->orderBy('z_kolo')
            ->orderBy('z_datum')
            ->get();

        $usedRowIndexes = [];
        $matched = [];
        $unmatched = [];

        foreach ($matches as $match) {
            $best = $this->bestRowFor($match, $rows, $usedRowIndexes);

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

            [$index, $row, $score] = $best;
            $usedRowIndexes[$index] = true;

            $matched[] = [
                'match_id' => $match->z_id,
                'round' => $match->z_kolo,
                'home_team' => $match->homeTeam?->m_nazev,
                'away_team' => $match->awayTeam?->m_nazev,
                'date' => optional($match->z_datum)->toDateString(),
                'current_home_goals' => $match->z_goly_d,
                'current_away_goals' => $match->z_goly_h,
                'proposed_home_goals' => $row['home_goals'],
                'proposed_away_goals' => $row['away_goals'],
                'match_confidence' => round($score, 1),
            ];
        }

        return ['matched' => $matched, 'unmatched' => $unmatched, 'parse_errors' => $parseErrors];
    }

    /**
     * Znovu naparsuje `$text` (mezistav preview se neukládá) a zapíše góly
     * jen pro `$matchIds`, které se v aktuálním návrhu skutečně napárovaly.
     *
     * @param  array<int, int>  $matchIds
     * @return array{updated: array<int, int>}
     */
    public function apply(Rocnik $rocnik, string $text, array $matchIds): array
    {
        $proposals = collect($this->preview($rocnik, $text)['matched'])->keyBy('match_id');

        $updated = [];

        foreach ($matchIds as $matchId) {
            $proposal = $proposals->get($matchId);

            if ($proposal === null) {
                continue;
            }

            $match = GameMatch::findOrFail($matchId);

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
     * @return array{0: array<int, array{home_name: string, away_name: string, home_goals: int, away_goals: int}>, 1: array<int, array{line: int, text: string}>}
     */
    private function parse(string $text): array
    {
        $rows = [];
        $errors = [];

        $lines = preg_split('/\r\n|\r|\n/', trim($text));

        foreach ($lines as $lineNumber => $line) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            if (! preg_match(self::LINE_PATTERN, $line, $m)) {
                $errors[] = ['line' => $lineNumber + 1, 'text' => $line];

                continue;
            }

            $rows[] = [
                'home_name' => trim($m[1]),
                'away_name' => trim($m[2]),
                'home_goals' => (int) $m[3],
                'away_goals' => (int) $m[4],
            ];
        }

        return [$rows, $errors];
    }

    /**
     * @param  array<int, array{home_name: string, away_name: string, home_goals: int, away_goals: int}>  $rows
     * @param  array<int, bool>  $usedRowIndexes
     * @return array{0: int, 1: array<string, mixed>, 2: float}|null
     */
    private function bestRowFor(GameMatch $match, array $rows, array $usedRowIndexes): ?array
    {
        $home = $match->homeTeam?->m_nazev ?? '';
        $away = $match->awayTeam?->m_nazev ?? '';

        $best = null;

        foreach ($rows as $index => $row) {
            if (isset($usedRowIndexes[$index])) {
                continue;
            }

            $homePercent = TeamNameMatcher::similarity($home, $row['home_name']);
            $awayPercent = TeamNameMatcher::similarity($away, $row['away_name']);

            // Obě strany musí projít prahem samostatně — viz stejná úvaha v
            // ResultsImportService::bestFixtureFor().
            if ($homePercent < self::MIN_NAME_MATCH_PERCENT || $awayPercent < self::MIN_NAME_MATCH_PERCENT) {
                continue;
            }

            $score = ($homePercent + $awayPercent) / 2;

            if ($best === null || $score > $best[2]) {
                $best = [$index, $row, $score];
            }
        }

        return $best;
    }
}
