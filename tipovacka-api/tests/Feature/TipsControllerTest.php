<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Team;
use App\Models\Tips;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TipsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Player $player;

    protected GameMatch $match;

    protected function setUp(): void
    {
        parent::setUp();

        $this->player = Player::factory()->create();

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

        $this->match = GameMatch::create([
            'z_domaci' => $homeTeam->m_id,
            'z_hoste' => $awayTeam->m_id,
            'z_datum' => now()->addWeek()->toDateString(),
            'z_kolo' => 1,
            'z_rocnik' => 1,
        ]);
    }

    // Test GET /api/tips - zobrazení všech tipů
    public function test_can_get_all_tips()
    {
        Tips::create([
            't_zapas' => $this->match->z_id,
            't_hrac' => $this->player->h_id,
            't_tip_d' => 1,
            't_tip_h' => 0,
            't_datum' => now(),
            't_rocnik' => 1,
        ]);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/tips');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    // Test GET /api/tips - bez autentizace by měl vrátit 401
    public function test_cannot_get_tips_without_auth()
    {
        $response = $this->getJson('/api/tips');

        $response->assertUnauthorized();
    }

    // Test POST /api/tips - vytvoření nového tipu
    public function test_can_create_tip()
    {
        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/tips', [
            't_zapas' => $this->match->z_id,
            't_tip_d' => 2,
            't_tip_h' => 1,
            't_rocnik' => '1',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('tipy', [
            't_zapas' => $this->match->z_id,
            't_hrac' => $this->player->h_id,
            't_tip_d' => 2,
            't_tip_h' => 1,
        ]);
    }

    // Test POST /api/tips - validace (povinná pole)
    public function test_cannot_create_tip_without_required_fields()
    {
        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/tips', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['t_zapas', 't_tip_d', 't_tip_h', 't_rocnik']);
    }

    // Test POST /api/tips - nejde tipovat zápas, který už má výsledek
    public function test_cannot_create_tip_for_match_with_result()
    {
        $this->match->update(['z_goly_d' => 1, 'z_goly_h' => 1]);

        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/tips', [
            't_zapas' => $this->match->z_id,
            't_tip_d' => 1,
            't_tip_h' => 1,
            't_rocnik' => '1',
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseMissing('tipy', ['t_zapas' => $this->match->z_id]);
    }

    // Test POST /api/tips - nejde tipovat zápas, který už začal
    public function test_cannot_create_tip_for_started_match()
    {
        $this->match->update(['z_datum' => now()->subDay()->toDateString()]);

        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/tips', [
            't_zapas' => $this->match->z_id,
            't_tip_d' => 1,
            't_tip_h' => 1,
            't_rocnik' => '1',
        ]);

        $response->assertUnprocessable();
    }

    // Test POST /api/tips - nejde podat druhý tip na stejný zápas
    public function test_cannot_create_duplicate_tip_for_same_match()
    {
        Tips::create([
            't_zapas' => $this->match->z_id,
            't_hrac' => $this->player->h_id,
            't_tip_d' => 1,
            't_tip_h' => 0,
            't_datum' => now(),
            't_rocnik' => 1,
        ]);

        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/tips', [
            't_zapas' => $this->match->z_id,
            't_tip_d' => 2,
            't_tip_h' => 0,
            't_rocnik' => '1',
        ]);

        $response->assertStatus(409);
        $this->assertDatabaseCount('tipy', 1);
    }

    // Test PUT /api/tips/{id} - nejde upravit tip na zápas, který už má výsledek
    public function test_cannot_update_tip_for_match_with_result()
    {
        $tip = Tips::create([
            't_zapas' => $this->match->z_id,
            't_hrac' => $this->player->h_id,
            't_tip_d' => 1,
            't_tip_h' => 0,
            't_datum' => now(),
            't_rocnik' => 1,
        ]);

        $this->match->update(['z_goly_d' => 1, 'z_goly_h' => 0]);

        $response = $this->actingAs($this->player, 'sanctum')->putJson("/api/tips/{$tip->t_id}", [
            't_tip_d' => 2,
            't_tip_h' => 0,
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseHas('tipy', ['t_id' => $tip->t_id, 't_tip_d' => 1]);
    }

    // Test GET /api/tips - cizí tip na budoucí zápas se nesmí zobrazit
    public function test_other_players_tip_for_future_match_is_hidden()
    {
        $other = Player::factory()->create();

        Tips::create([
            't_zapas' => $this->match->z_id,
            't_hrac' => $other->h_id,
            't_tip_d' => 3,
            't_tip_h' => 0,
            't_datum' => now(),
            't_rocnik' => 1,
        ]);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/tips');

        $response->assertOk();
        $response->assertJsonCount(0, 'data');
    }

    // Test GET /api/tips - cizí tip na zápas, který už začal, se zobrazí
    public function test_other_players_tip_for_started_match_is_visible()
    {
        $this->match->update(['z_datum' => now()->subDay()->toDateString()]);
        $other = Player::factory()->create();

        Tips::create([
            't_zapas' => $this->match->z_id,
            't_hrac' => $other->h_id,
            't_tip_d' => 3,
            't_tip_h' => 0,
            't_datum' => now(),
            't_rocnik' => 1,
        ]);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/tips');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }
}
