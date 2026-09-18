<?php

namespace Tests\Feature;

use App\Models\Player;
use App\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Player $player;

    protected Player $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->player = Player::factory()->create();
        $this->admin = Player::factory()->admin()->create();
    }

    // Test GET /api/team - zobrazení všech týmů
    public function test_can_get_all_teams()
    {
        Team::create([
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/team');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.m_nazev', 'Ajax');
    }

    // Test GET /api/team - ověř že vrací stránkování (paginate)
    public function test_teams_are_paginated()
    {
        Team::factory()->count(15)->create();

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/team');

        $response->assertOk();
        $response->assertJsonCount(10, 'data');
        $response->assertJsonPath('total', 15);
    }

    // Test POST /api/team - vytvoření nového týmu
    public function test_can_create_team()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/team', [
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('muzstva', [
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
        ]);
    }

    // Test POST /api/team - neadmin nemá oprávnění vytvořit tým
    public function test_non_admin_cannot_create_team()
    {
        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/team', [
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('muzstva', ['m_nazev' => 'Ajax']);
    }

    // Test POST /api/team - validace m_nazev (povinné)
    public function test_cannot_create_team_without_name()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/team', [
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('m_nazev');
    }

    // Test POST /api/team - validace m_mesto (povinné)
    public function test_cannot_create_team_without_city()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/team', [
            'm_nazev' => 'Ajax',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('m_mesto');
    }

    // Test POST /api/team - validace m_liga (musí být integer)
    public function test_cannot_create_team_with_invalid_league()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/team', [
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 'not-a-number',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('m_liga');
    }

    // Test POST /api/team - vrátí JSON odpověď se statusem 201
    public function test_create_team_returns_correct_status_code()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/team', [
            'm_nazev' => 'Ajax',
            'm_mesto' => 'Amsterdam',
            'm_znak' => 'A',
            'm_platnost' => 'A',
            'm_liga' => 1,
        ]);

        $response->assertStatus(201);
    }
}
