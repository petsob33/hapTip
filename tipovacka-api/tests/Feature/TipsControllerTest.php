<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Team;
use App\Models\User;
use Tests\TestCase;

class TipsControllerTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    // Test GET /api/tips - zobrazení všech tipů
    public function test_can_get_all_tips()
    {
        // TODO: Doplň test
    }

    // Test GET /api/tips - bez autentizace by měl vrátit 401
    public function test_cannot_get_tips_without_auth()
    {
        // TODO: Doplň test
    }

    // Test POST /api/tips - vytvoření nového tipu
    public function test_can_create_tip()
    {
        // TODO: Doplň test
    }

    // Test POST /api/tips - validace (povinná pole)
    public function test_cannot_create_tip_without_required_fields()
    {
        // TODO: Doplň test
    }
}
