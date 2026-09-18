<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Rocnik;
use App\Models\Team;
use App\Models\Tips;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ResultsImportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Player $player;

    protected Player $admin;

    protected Rocnik $rocnik;

    protected Team $sparta;

    protected Team $slavia;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.football_api.key' => 'test-key']);
        config(['services.football_api.leagues.1' => 345]);

        $this->player = Player::factory()->create();
        $this->admin = Player::factory()->admin()->create();
        $this->rocnik = Rocnik::create(['r_rocnik' => '2025-26', 'r_liga' => 1]);

        $this->sparta = Team::create([
            'm_nazev' => 'AC Sparta Praha',
            'm_mesto' => 'Praha',
            'm_znak' => 'S',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $this->slavia = Team::create([
            'm_nazev' => 'SK Slavia Praha',
            'm_mesto' => 'Praha',
            'm_znak' => 'SL',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);
    }

    private function fakeFixtures(array $fixtures): void
    {
        Http::fake([
            'v3.football.api-sports.io/fixtures*' => Http::response(['response' => $fixtures], 200),
        ]);
    }

    private function fixture(int $id, string $home, string $away, string $date, ?int $homeGoals, ?int $awayGoals, string $status = 'FT'): array
    {
        return [
            'fixture' => ['id' => $id, 'date' => $date, 'status' => ['short' => $status]],
            'teams' => ['home' => ['name' => $home], 'away' => ['name' => $away]],
            'goals' => ['home' => $homeGoals, 'away' => $awayGoals],
        ];
    }

    public function test_non_admin_cannot_preview()
    {
        $this->fakeFixtures([]);

        $response = $this->actingAs($this->player, 'sanctum')
            ->getJson("/api/matches/import-results/preview?rocnik={$this->rocnik->r_id}");

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_apply()
    {
        $response = $this->actingAs($this->player, 'sanctum')
            ->postJson('/api/matches/import-results/apply', [
                'rocnik' => $this->rocnik->r_id,
                'match_ids' => [1],
            ]);

        $response->assertStatus(403);
    }

    public function test_preview_matches_by_team_name_and_date_without_writing()
    {
        $match = GameMatch::create([
            'z_domaci' => $this->sparta->m_id,
            'z_hoste' => $this->slavia->m_id,
            'z_datum' => '2026-08-30',
            'z_kolo' => 5,
            'z_rocnik' => $this->rocnik->r_id,
        ]);

        $this->fakeFixtures([
            $this->fixture(111, 'Sparta Praha', 'Slavia Praha', '2026-08-30T18:00:00+00:00', 2, 1),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/matches/import-results/preview?rocnik={$this->rocnik->r_id}");

        $response->assertOk();
        $response->assertJsonCount(1, 'matched');
        $response->assertJsonCount(0, 'unmatched');
        $response->assertJsonPath('matched.0.match_id', $match->z_id);
        $response->assertJsonPath('matched.0.proposed_home_goals', 2);
        $response->assertJsonPath('matched.0.proposed_away_goals', 1);

        $this->assertNull($match->fresh()->z_goly_d);
    }

    public function test_preview_reports_unmatched_when_no_fixture_is_close_enough()
    {
        GameMatch::create([
            'z_domaci' => $this->sparta->m_id,
            'z_hoste' => $this->slavia->m_id,
            'z_datum' => '2026-08-30',
            'z_kolo' => 5,
            'z_rocnik' => $this->rocnik->r_id,
        ]);

        $this->fakeFixtures([
            $this->fixture(111, 'Baník Ostrava', 'Zbrojovka Brno', '2026-09-15T18:00:00+00:00', 0, 0),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/matches/import-results/preview?rocnik={$this->rocnik->r_id}");

        $response->assertOk();
        $response->assertJsonCount(0, 'matched');
        $response->assertJsonCount(1, 'unmatched');
    }

    public function test_apply_writes_score_and_triggers_scoring()
    {
        $match = GameMatch::create([
            'z_domaci' => $this->sparta->m_id,
            'z_hoste' => $this->slavia->m_id,
            'z_datum' => '2026-08-30',
            'z_kolo' => 5,
            'z_rocnik' => $this->rocnik->r_id,
        ]);

        $tip = Tips::create([
            't_zapas' => $match->z_id,
            't_hrac' => $this->player->h_id,
            't_tip_d' => 2,
            't_tip_h' => 1,
            't_rocnik' => $this->rocnik->r_id,
            't_datum' => '2026-08-25',
        ]);

        $this->fakeFixtures([
            $this->fixture(111, 'Sparta Praha', 'Slavia Praha', '2026-08-30T18:00:00+00:00', 2, 1),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/matches/import-results/apply', [
                'rocnik' => $this->rocnik->r_id,
                'match_ids' => [$match->z_id],
            ]);

        $response->assertOk();
        $response->assertJson(['updated' => [$match->z_id]]);

        $match->refresh();
        $this->assertSame(2, $match->z_goly_d);
        $this->assertSame(1, $match->z_goly_h);

        $tip->refresh();
        $this->assertSame(5, $tip->t_body);
    }

    public function test_apply_skips_match_ids_that_are_no_longer_proposed()
    {
        $matched = GameMatch::create([
            'z_domaci' => $this->sparta->m_id,
            'z_hoste' => $this->slavia->m_id,
            'z_datum' => '2026-08-30',
            'z_kolo' => 5,
            'z_rocnik' => $this->rocnik->r_id,
        ]);

        // Výsledek mezitím zapsal admin ručně — apply ho nesmí přepsat.
        $alreadyScored = GameMatch::create([
            'z_domaci' => $this->slavia->m_id,
            'z_hoste' => $this->sparta->m_id,
            'z_datum' => '2026-09-05',
            'z_kolo' => 6,
            'z_rocnik' => $this->rocnik->r_id,
            'z_goly_d' => 3,
            'z_goly_h' => 0,
        ]);

        $this->fakeFixtures([
            $this->fixture(111, 'Sparta Praha', 'Slavia Praha', '2026-08-30T18:00:00+00:00', 2, 1),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/matches/import-results/apply', [
                'rocnik' => $this->rocnik->r_id,
                'match_ids' => [$matched->z_id, $alreadyScored->z_id],
            ]);

        $response->assertOk();
        $response->assertJson(['updated' => [$matched->z_id]]);

        $alreadyScored->refresh();
        $this->assertSame(3, $alreadyScored->z_goly_d);
        $this->assertSame(0, $alreadyScored->z_goly_h);
    }

    public function test_preview_fails_with_validation_error_when_league_is_not_mapped()
    {
        config(['services.football_api.leagues.1' => null]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/matches/import-results/preview?rocnik={$this->rocnik->r_id}");

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('rocnik');
    }
}
