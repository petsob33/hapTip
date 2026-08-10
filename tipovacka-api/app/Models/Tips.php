<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}