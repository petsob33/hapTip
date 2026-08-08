<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tip extends Model
{
    protected $fillable = [
        'uzivatel_id',
        'zapas_id',
        'goly_domaci',
        'goly_hoste',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uzivatel_id');
    }

    public function gameMatch(): BelongsTo
    {
        return $this->belongsTo(GameMatch::class, 'zapas_id');
    }
}
