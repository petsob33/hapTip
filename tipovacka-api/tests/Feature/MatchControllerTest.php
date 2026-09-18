<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Player $player;

    protected Player $admin;

    protected Team $homeTeam;

    protected Team $awayTeam;

    protected function setUp(): void
    {
        parent::setUp();

        $this->player = Player::factory()->create();
        $this->admin = Player::factory()->admin()->create();

        $this->homeTeam = Team::create([
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $this->awayTeam = Team::create([
            'm_nazev' => 'Slavia',
            'm_mesto' => 'Praha',
            'm_znak' => 'S',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);
    }

    // Test GET /api/matches - zobrazení všech zápasů
    public function test_can_get_all_matches()
    {
        GameMatch::create([
            'z_domaci' => $this->homeTeam->m_id,
            'z_hoste' => $this->awayTeam->m_id,
            'z_datum' => '2026-01-01',
            'z_kolo' => 1,
            'z_rocnik' => 1,
        ]);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/matches');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.home_team', 'Ajax');
        $response->assertJsonPath('data.0.away_team', 'Slavia');
    }

    // Test GET /api/matches - bez autentizace by měl vrátit 401
    public function test_cannot_get_matches_without_auth()
    {
        $response = $this->getJson('/api/matches');

        $response->assertUnauthorized();
    }

    // Test POST /api/matches - vytvoření nového zápasu
    public function test_can_create_match()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/matches', [
            'z_domaci' => $this->homeTeam->m_id,
            'z_hoste' => $this->awayTeam->m_id,
            'z_datum' => '2026-05-01',
            'z_kolo' => 3,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('zapasy', [
            'z_domaci' => $this->homeTeam->m_id,
            'z_hoste' => $this->awayTeam->m_id,
            'z_kolo' => 3,
        ]);
    }

    // Test POST /api/matches - validace z_domaci (povinné)
    public function test_cannot_create_match_without_home_team()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/matches', [
            'z_hoste' => $this->awayTeam->m_id,
            'z_datum' => '2026-05-01',
            'z_kolo' => 3,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('z_domaci');
    }

    // Test POST /api/matches - validace z_domaci a z_hoste nemohou být stejné
    public function test_cannot_create_match_with_same_home_and_away_team()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/matches', [
            'z_domaci' => $this->homeTeam->m_id,
            'z_hoste' => $this->homeTeam->m_id,
            'z_datum' => '2026-05-01',
            'z_kolo' => 3,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('z_hoste');
    }

    // Test POST /api/matches - validace z_datum (povinné, musí být date)
    public function test_cannot_create_match_without_date()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/matches', [
            'z_domaci' => $this->homeTeam->m_id,
            'z_hoste' => $this->awayTeam->m_id,
            'z_kolo' => 3,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('z_datum');
    }

    // Test POST /api/matches - z_domaci a z_hoste musí existovat v DB
    public function test_cannot_create_match_with_nonexistent_team()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/matches', [
            'z_domaci' => 999999,
            'z_hoste' => $this->awayTeam->m_id,
            'z_datum' => '2026-05-01',
            'z_kolo' => 3,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('z_domaci');
    }
}
