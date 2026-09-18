<?php

namespace Tests\Feature;

use App\Models\Player;
use App\Models\Tips;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Player $player;

    protected function setUp(): void
    {
        parent::setUp();

        $this->player = Player::factory()->create();
    }

    private function tip(int $hrac, int $rocnik, ?int $body): void
    {
        Tips::create([
            't_zapas' => 1,
            't_hrac' => $hrac,
            't_tip_d' => 1,
            't_tip_h' => 0,
            't_body' => $body,
            't_datum' => '2026-01-01',
            't_rocnik' => $rocnik,
        ]);
    }

    // Test GET /api/leadboard - seřazení podle bodů, sestupně
    public function test_leaderboard_orders_by_total_points_descending()
    {
        $a = Player::factory()->create(['h_nick' => 'a']);
        $b = Player::factory()->create(['h_nick' => 'b']);

        $this->tip($a->h_id, 1, 3);
        $this->tip($b->h_id, 1, 5);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/leadboard?rocnik=1');

        $response->assertOk();
        $response->assertJsonPath('data.0.h_nick', 'b');
        $response->assertJsonPath('data.1.h_nick', 'a');
    }

    // Test GET /api/leadboard/podiums - umístění se počítají zvlášť za KAŽDÝ ročník,
    // ne přes součet bodů napříč ročníky
    public function test_podiums_counts_placements_per_season()
    {
        $a = Player::factory()->create(['h_nick' => 'a']);
        $b = Player::factory()->create(['h_nick' => 'b']);
        $c = Player::factory()->create(['h_nick' => 'c']);

        // Ročník 1: a=10 (1.), b=5 (2.), c=3 (3.)
        $this->tip($a->h_id, 1, 10);
        $this->tip($b->h_id, 1, 5);
        $this->tip($c->h_id, 1, 3);

        // Ročník 2: b=8 (1.), a=6 (2.) - jen dva hráči, žádné 3. místo
        $this->tip($b->h_id, 2, 8);
        $this->tip($a->h_id, 2, 6);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/leadboard/podiums');

        $response->assertOk();
        $byNick = collect($response->json('data'))->keyBy('h_nick');

        $this->assertSame(1, $byNick['a']['first']);
        $this->assertSame(1, $byNick['a']['second']);
        $this->assertSame(0, $byNick['a']['third']);

        $this->assertSame(1, $byNick['b']['first']);
        $this->assertSame(1, $byNick['b']['second']);

        $this->assertSame(1, $byNick['c']['third']);
        $this->assertSame(0, $byNick['c']['first']);
    }

    // Test GET /api/leadboard - bez ?rocnik= vrací součet přes VŠECHNY ročníky,
    // ne přes zápasy z aktuálního kalendářního roku (rocnik je rocniky.r_id,
    // ne kalendářní rok)
    public function test_leaderboard_without_rocnik_param_sums_all_seasons()
    {
        $a = Player::factory()->create(['h_nick' => 'a']);

        $this->tip($a->h_id, 1, 3);
        $this->tip($a->h_id, 2, 5);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/leadboard');

        $response->assertOk();
        $response->assertJsonPath('data.0.h_nick', 'a');
        $this->assertEquals(8, (int) $response->json('data.0.total_points'));
    }

    // Test GET /api/leadboard/podiums - sezóna bez jediného obodovaného tipu
    // (samé NULL t_body) nikomu umístění nepřidá
    public function test_podiums_ignores_season_with_no_scored_tips()
    {
        $a = Player::factory()->create(['h_nick' => 'a']);

        $this->tip($a->h_id, 1, null);

        $response = $this->actingAs($this->player, 'sanctum')->getJson('/api/leadboard/podiums');

        $response->assertOk();
        $response->assertJsonCount(0, 'data');
    }
}
