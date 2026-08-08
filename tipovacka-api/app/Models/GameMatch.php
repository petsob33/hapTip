<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameMatch extends Model
{
    protected $table = 'zapasy';

    protected $fillable = [
        'tym_domaci',
        'tym_hoste',
        'cas_vykopu',
        'goly_domaci',
        'goly_hoste',
    ];

    protected function casts(): array
    {
        return [
            'cas_vykopu' => 'datetime',
        ];
    }

    public function tips(): HasMany
    {
        return $this->hasMany(Tip::class, 'zapas_id');
    }
}
