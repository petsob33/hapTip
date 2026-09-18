<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tips extends Model
{
    // Specifikace tabulky (protože název neodpovídá anglickému množnému číslu 'tips')
    protected $table = 'tipy';

    // Vlastní primární klíč
    protected $primaryKey = 't_id';

    // Vypnutí standardních Laravel timestampů (created_at, updated_at)
    public $timestamps = false;

    // Sloupce, které lze plnit hromadně (Mass Assignment)
    protected $fillable = [
        't_zapas',
        't_hrac',
        't_tip_d',
        't_tip_h',
        't_body',
        't_datum',
        't_rocnik',
        't_joker',
    ];

    // Zde bys mohl přidat castování, např. pro datum, pokud je to potřeba:
    protected function casts(): array
    {
        return [
            // 't_datum' => 'datetime', // Odkomentuj, pokud chceš datum používat jako Carbon instanci
        ];
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(GameMatch::class, 't_zapas', 'z_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class, 't_hrac', 'h_id');
    }
}
