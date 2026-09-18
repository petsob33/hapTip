<?php

namespace Tests\Feature;

use App\Models\GameMatch;
use App\Models\Player;
use App\Models\Rocnik;
use App\Models\Team;
use App\Models\Tips;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManualResultsImportControllerTest extends TestCase
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

    public function test_non_admin_cannot_use_manual_preview()
    {
        $response = $this->actingAs($this->player, 'sanctum')
            ->postJson('/api/matches/import-results/manual-preview', [
                'rocnik' => $this->rocnik->r_id,
                'text' => 'Sparta - Slavia 2:1',
            ]);

        $response->assertStatus(403);
    }

    public function test_manual_preview_matches_by_team_name_without_writing()
    {
        $match = GameMatch::create([
            'z_domaci' => $this->sparta->m_id,
            'z_hoste' => $this->slavia->m_id,
            'z_datum' => '2026-08-30',
            'z_kolo' => 5,
            'z_rocnik' => $this->rocnik->r_id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/matches/import-results/manual-preview', [
                'rocnik' => $this->rocnik->r_id,
                'text' => "Sparta - Slavia 2:1\nnesmyslný řádek",
            ]);

        $response->assertOk();
        $response->assertJsonCount(1, 'matched');
        $response->assertJsonCount(0, 'unmatched');
        $response->assertJsonCount(1, 'parse_errors');
        $response->assertJsonPath('matched.0.match_id', $match->z_id);
        $response->assertJsonPath('matched.0.proposed_home_goals', 2);
        $response->assertJsonPath('matched.0.proposed_away_goals', 1);
        $response->assertJsonPath('parse_errors.0.line', 2);

        $this->assertNull($match->fresh()->z_goly_d);
    }

    public function test_manual_preview_reports_unmatched_when_team_name_does_not_fit()
    {
        GameMatch::create([
            'z_domaci' => $this->sparta->m_id,
            'z_hoste' => $this->slavia->m_id,
            'z_datum' => '2026-08-30',
            'z_kolo' => 5,
            'z_rocnik' => $this->rocnik->r_id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/matches/import-results/manual-preview', [
                'rocnik' => $this->rocnik->r_id,
                'text' => 'Baník - Zbrojovka 0:0',
            ]);

        $response->assertOk();
        $response->assertJsonCount(0, 'matched');
        $response->assertJsonCount(1, 'unmatched');
    }

    public function test_manual_apply_writes_score_and_triggers_scoring()
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

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/matches/import-results/manual-apply', [
                'rocnik' => $this->rocnik->r_id,
                'text' => 'Sparta - Slavia 2:1',
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
}
