<?php

namespace Tests\Feature;

use App\Models\Team;
use Tests\TestCase;

class TeamControllerTest extends TestCase
{
    // Test GET /api/teams - zobrazení všech týmů
    public function test_can_get_all_teams()
    {
        // TODO: Doplň test
    }

    // Test GET /api/teams - ověř že vrací stránkování (paginate)
    public function test_teams_are_paginated()
    {
        // TODO: Doplň test
    }

    // Test POST /api/teams - vytvoření nového týmu
    public function test_can_create_team()
    {
        // TODO: Doplň test
    }

    // Test POST /api/teams - validace m_nazev (povinné)
    public function test_cannot_create_team_without_name()
    {
        // TODO: Doplň test
    }

    // Test POST /api/teams - validace m_mesto (povinné)
    public function test_cannot_create_team_without_city()
    {
        // TODO: Doplň test
    }

    // Test POST /api/teams - validace m_liga (musí být integer)
    public function test_cannot_create_team_with_invalid_league()
    {
        // TODO: Doplň test
    }

    // Test POST /api/teams - vrátí JSON odpověď se statusem 201
    public function test_create_team_returns_correct_status_code()
    {
        // TODO: Doplň test
    }
}
