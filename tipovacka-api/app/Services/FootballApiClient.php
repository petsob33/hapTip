<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Tenký wrapper nad API-Football (`/fixtures`), viz config/services.php. */
class FootballApiClient
{
    private string $baseUrl;

    private ?string $key;

    public function __construct(?string $baseUrl = null, ?string $key = null)
    {
        $this->baseUrl = $baseUrl ?? config('services.football_api.base_url');
        $this->key = $key ?? config('services.football_api.key');
    }

    /**
     * Vrátí syrová fixture data pro celý ročník naráz — API-Football čísluje
     * kola jinak než interní `z_kolo` (řetězec jako "Regular Season - 5"),
     * párování na konkrétní zápas proto řeší ResultsImportService podle
     * týmů a data, ne podle kola.
     *
     * @return array<int, array<string, mixed>>
     */
    public function fixtures(int $leagueId, int $season): array
    {
        if (! $this->key) {
            throw new RuntimeException('FOOTBALL_API_KEY není v .env nastavený.');
        }

        $response = Http::withHeaders(['x-apisports-key' => $this->key])
            ->baseUrl($this->baseUrl)
            ->timeout(10)
            ->get('/fixtures', [
                'league' => $leagueId,
                'season' => $season,
            ]);

        if ($response->failed()) {
            throw new RuntimeException("Volání API-Football selhalo (HTTP {$response->status()}).");
        }

        // API-Football vrací chyby (neplatný klíč, vyčerpaná kvóta apod.) v
        // těle s HTTP 200, ne jako HTTP chybový stav — bez téhle kontroly by
        // to vypadalo jako "žádné zápasy k importu" místo skutečné chyby.
        $errors = $response->json('errors', []);
        if (! empty($errors)) {
            $message = is_array($errors) ? implode('; ', array_map('strval', $errors)) : (string) $errors;
            throw new RuntimeException("API-Football vrátilo chybu: {$message}");
        }

        return $response->json('response', []);
    }
}
