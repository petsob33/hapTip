<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameMatch extends Model
{
    protected $table = 'zapasy';

    protected $primaryKey = 'z_id';

    public $timestamps = false;

    protected $fillable = ['z_domaci', 'z_hoste', 'z_datum', 'z_kolo', 'z_rocnik', 'z_goly_d', 'z_goly_h'];

    protected function casts(): array
    {
        return [
            'z_datum' => 'date',
        ];
    }

    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'z_domaci', 'm_id');
    }

    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'z_hoste', 'm_id');
    }
    public function tips()
    {
        // 1. parametr: Třída modelu pro tipy (např. Tip::class)
        // 2. parametr: Název sloupce v tabulce tipů, který odkazuje na zápas (např. 'match_id')
        // 3. parametr: Název primárního klíče v tabulce zápasů (u tebe zřejmě 'z_id')
        return $this->hasMany(Tips::class, 't_zapas', 'z_id');
    }
}
