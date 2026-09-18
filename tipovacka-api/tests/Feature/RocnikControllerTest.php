<?php

namespace Tests\Feature;

use App\Models\Player;
use App\Models\Rocnik;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RocnikControllerTest extends TestCase
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

    // Test GET /api/rocniky - vrátí seznam ročníků
    public function test_can_get_all_rocniky()
    {
        Rocnik::create(['r_rocnik' => '2025-26', 'r_liga' => 1]);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/rocniky');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonPath('0.r_rocnik', '2025-26');
    }

    // Test POST /api/rocniky - admin může vytvořit nový ročník
    public function test_admin_can_create_rocnik()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/rocniky', [
            'r_rocnik' => '2026-27',
            'r_liga' => 1,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('rocniky', [
            'r_rocnik' => '2026-27',
            'r_liga' => 1,
        ]);
    }

    // Test POST /api/rocniky - neadmin nemá oprávnění vytvořit ročník
    public function test_non_admin_cannot_create_rocnik()
    {
        $response = $this->actingAs($this->player, 'sanctum')->postJson('/api/rocniky', [
            'r_rocnik' => '2026-27',
            'r_liga' => 1,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('rocniky', ['r_rocnik' => '2026-27']);
    }

    // Test POST /api/rocniky - název ročníku musí být unikátní
    public function test_cannot_create_duplicate_rocnik()
    {
        Rocnik::create(['r_rocnik' => '2026-27', 'r_liga' => 1]);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/rocniky', [
            'r_rocnik' => '2026-27',
            'r_liga' => 1,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('r_rocnik');
    }

    // Test POST /api/rocniky - r_liga musí být integer
    public function test_cannot_create_rocnik_with_invalid_liga()
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/rocniky', [
            'r_rocnik' => '2026-27',
            'r_liga' => 'not-a-number',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('r_liga');
    }
}
