<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Team;
use App\Models\User;
use Tests\TestCase;

class MatchControllerTest extends TestCase
{
    protected User $user;
    protected Team $homeTeam;
    protected Team $awayTeam;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Vytvoř testovacího uživatele
        $this->user = User::factory()->create();
        
        // Vytvoř dvě testovací týmy
        $this->homeTeam = Team::create([
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => '2024-01-01',
            'm_liga' => 1,
        ]);

        $this->awayTeam = Team::create([
            'm_nazev' => 'Slavia',
            'm_mesto' => 'Praha',
            'm_znak' => 'S',
            'm_platnost' => '2024-01-01',
            'm_liga' => 1,
        ]);
    }

    // Test GET /api/matches - zobrazení všech zápasů
    public function test_can_get_all_matches()
    {
        // TODO: Doplň test
    }

    // Test GET /api/matches - bez autentizace by měl vrátit 401
    public function test_cannot_get_matches_without_auth()
    {
        // TODO: Doplň test
    }

    // Test POST /api/matches - vytvoření nového zápasu
    public function test_can_create_match()
    {
        // TODO: Doplň test
    }

    // Test POST /api/matches - validace z_domaci (povinné)
    public function test_cannot_create_match_without_home_team()
    {
        // TODO: Doplň test
    }

    // Test POST /api/matches - validace z_domaci a z_hoste nemohou být stejné
    public function test_cannot_create_match_with_same_home_and_away_team()
    {
        // TODO: Doplň test
    }

    // Test POST /api/matches - validace z_datum (povinné, musí být date)
    public function test_cannot_create_match_without_date()
    {
        // TODO: Doplň test
    }

    // Test POST /api/matches - z_domaci a z_hoste musí existovat v DB
    public function test_cannot_create_match_with_nonexistent_team()
    {
        // TODO: Doplň test
    }
}
