<?php

namespace App\Console\Commands;

use App\Models\Player;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// One-time migration: `hraci` was imported from a legacy SQL dump where
// h_pasw is stored as plain text. AuthService::login() only accepts bcrypt
// hashes (see its comments), so those accounts can't log in until their
// stored password is hashed. This re-hashes each legacy password in place
// using its current (plain-text) value, so the account keeps working with
// the SAME password it already had — no re-registration needed.
class HashLegacyPasswords extends Command
{
    protected $signature = 'players:hash-legacy-passwords {--dry-run : List affected accounts without changing anything}';

    protected $description = 'Hash plain-text legacy passwords in hraci.h_pasw to bcrypt so those accounts can log in';

    public function handle(): int
    {
        $legacyPlayers = Player::query()
            ->whereNotNull('h_pasw')
            ->where('h_pasw', '!=', '')
            ->get()
            ->reject(fn (Player $player) => Str::startsWith($player->h_pasw, '$2y$'));

        if ($legacyPlayers->isEmpty()) {
            $this->info('Žádné legacy účty s plain-text heslem nenalezeny.');

            return self::SUCCESS;
        }

        $this->info(sprintf('Nalezeno %d legacy účtů s plain-text heslem.', $legacyPlayers->count()));

        if ($this->option('dry-run')) {
            $this->table(
                ['h_id', 'h_nick', 'h_email'],
                $legacyPlayers->map(fn (Player $p) => [$p->h_id, $p->h_nick, $p->h_email])->all(),
            );

            return self::SUCCESS;
        }

        DB::transaction(function () use ($legacyPlayers) {
            foreach ($legacyPlayers as $player) {
                // Bypasses the model's 'h_pasw' => 'hashed' cast (which would
                // hash whatever we assign) — we want direct control here to
                // hash exactly the current raw value via a plain query update.
                DB::table('hraci')
                    ->where('h_id', $player->h_id)
                    ->update(['h_pasw' => Hash::make($player->h_pasw)]);
            }
        });

        $this->info(sprintf('Hotovo. Přehashováno %d hesel.', $legacyPlayers->count()));

        return self::SUCCESS;
    }
}
