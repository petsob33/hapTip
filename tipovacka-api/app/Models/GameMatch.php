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
}
