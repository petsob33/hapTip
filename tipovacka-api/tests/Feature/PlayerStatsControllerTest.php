<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Team;
use App\Models\Tips;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlayerStatsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Player $player1;

    protected Player $player2;

    /** @var array<int, int> */
    protected array $teamIds;

    protected function setUp(): void
    {
        parent::setUp();

        $this->player1 = Player::factory()->create();
        $this->player2 = Player::factory()->create();

        $homeTeam = Team::create([
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $awayTeam = Team::create([
            'm_nazev' => 'Slavia',
            'm_mesto' => 'Praha',
            'm_znak' => 'S',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $this->teamIds = [$homeTeam->m_id, $awayTeam->m_id];
    }

    private function createMatch(int $round, int $rocnik = 1): GameMatch
    {
        return GameMatch::create([
            'z_domaci' => $this->teamIds[0],
            'z_hoste' => $this->teamIds[1],
            'z_datum' => '2026-05-01',
            'z_kolo' => $round,
            'z_rocnik' => $rocnik,
        ]);
    }

    // GET /api/players/{player}/stats - průměr a forma se počítají jen z obodovaných kol
    public function test_can_get_player_stats()
    {
        $match1 = $this->createMatch(1);
        $match2 = $this->createMatch(2);
        $match3 = $this->createMatch(3);

        Tips::create(['t_zapas' => $match1->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 3, 't_datum' => now(), 't_rocnik' => 1]);
        Tips::create(['t_zapas' => $match2->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 5, 't_datum' => now(), 't_rocnik' => 1]);
        // Zápas 3 zatím není obodovaný (t_body null) - nesmí spadnout do průměru.
        Tips::create(['t_zapas' => $match3->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => null, 't_datum' => now(), 't_rocnik' => 1]);

        $response = $this->actingAs($this->player1, 'sanctum')
            ->getJson("/api/players/{$this->player1->h_id}/stats?rocnik=1");

        $response->assertOk();
        $response->assertJson([
            'rounds_played' => 2,
            'total_points' => 8,
            'avg_points_per_round' => 4.0,
        ]);
        $response->assertJsonCount(2, 'form');
        $response->assertJsonPath('form.0.round', 1);
        $response->assertJsonPath('form.1.round', 2);
    }

    // GET /api/players/{player}/stats - hráč bez tipů v sezóně
    public function test_player_stats_with_no_tips_returns_nulls()
    {
        $response = $this->actingAs($this->player1, 'sanctum')
            ->getJson("/api/players/{$this->player1->h_id}/stats?rocnik=1");

        $response->assertOk();
        $response->assertJson([
            'rounds_played' => 0,
            'total_points' => 0,
            'avg_points_per_round' => null,
            'accuracy' => [
                'tips_scored' => 0,
                'exact' => 0,
                'exact_pct' => null,
                'outcome' => 0,
                'outcome_pct' => null,
                'miss' => 0,
                'miss_pct' => null,
            ],
        ]);
    }

    // GET /api/players/{player}/stats - přesnost podle bodování TipScoringService (5/1/0)
    public function test_player_stats_includes_accuracy_breakdown()
    {
        $match1 = $this->createMatch(1);
        $match2 = $this->createMatch(2);
        $match3 = $this->createMatch(3);
        $match4 = $this->createMatch(4);

        Tips::create(['t_zapas' => $match1->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 5, 't_datum' => now(), 't_rocnik' => 1]);
        Tips::create(['t_zapas' => $match2->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 1, 't_datum' => now(), 't_rocnik' => 1]);
        Tips::create(['t_zapas' => $match3->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 0, 't_datum' => now(), 't_rocnik' => 1]);
        // Zápas 4 zatím není obodovaný - nesmí spadnout do přesnosti.
        Tips::create(['t_zapas' => $match4->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => null, 't_datum' => now(), 't_rocnik' => 1]);

        $response = $this->actingAs($this->player1, 'sanctum')
            ->getJson("/api/players/{$this->player1->h_id}/stats?rocnik=1");

        $response->assertOk();
        $response->assertJson([
            'accuracy' => [
                'tips_scored' => 3,
                'exact' => 1,
                'exact_pct' => 33.3,
                'outcome' => 1,
                'outcome_pct' => 33.3,
                'miss' => 1,
                'miss_pct' => 33.3,
            ],
        ]);
    }

    // GET /api/players/h2h - srovnání jen na společně otipovaných obodovaných zápasech
    public function test_can_get_h2h()
    {
        $match1 = $this->createMatch(1);
        $match2 = $this->createMatch(2);
        $match3 = $this->createMatch(3);

        // Zápas 1: player1 vyhrává kolo (5 > 2)
        Tips::create(['t_zapas' => $match1->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 5, 't_datum' => now(), 't_rocnik' => 1]);
        Tips::create(['t_zapas' => $match1->z_id, 't_hrac' => $this->player2->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 2, 't_datum' => now(), 't_rocnik' => 1]);

        // Zápas 2: remíza (3 = 3)
        Tips::create(['t_zapas' => $match2->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 3, 't_datum' => now(), 't_rocnik' => 1]);
        Tips::create(['t_zapas' => $match2->z_id, 't_hrac' => $this->player2->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 3, 't_datum' => now(), 't_rocnik' => 1]);

        // Zápas 3: tipoval jen player1 - nezapočítá se do srovnání
        Tips::create(['t_zapas' => $match3->z_id, 't_hrac' => $this->player1->h_id, 't_tip_d' => 1, 't_tip_h' => 0, 't_body' => 9, 't_datum' => now(), 't_rocnik' => 1]);

        $response = $this->actingAs($this->player1, 'sanctum')
            ->getJson("/api/players/h2h?player1={$this->player1->h_id}&player2={$this->player2->h_id}&rocnik=1");

        $response->assertOk();
        $response->assertJson([
            'matches_compared' => 2,
            'wins' => ['player1' => 1, 'player2' => 0, 'draws' => 1],
            'total_points' => ['player1' => 8, 'player2' => 5],
        ]);
    }

    // GET /api/players/h2h - validace, stejné ID pro oba hráče
    public function test_h2h_rejects_same_player_twice()
    {
        $response = $this->actingAs($this->player1, 'sanctum')
            ->getJson("/api/players/h2h?player1={$this->player1->h_id}&player2={$this->player1->h_id}");

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['player2']);
    }

    // GET /api/players/{player}/stats - bez autentizace 401
    public function test_cannot_get_stats_without_auth()
    {
        $response = $this->getJson("/api/players/{$this->player1->h_id}/stats");

        $response->assertUnauthorized();
    }
}
