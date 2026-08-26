<?php

namespace App\Models;

use App\Enums\ExtraType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Extra extends Model
{
    protected $table = 'extra';

    protected $primaryKey = 'e_id';

    public $timestamps = false;

    protected $fillable = [
        'e_pril',
        'e_vysledek',
        'e_goly_d',
        'e_goly_h',
        'e_zapas',
        'e_muzstva',
        'e_rocnik',
        'e_platnost',
        'e_datum_pl',
        'e_autor',
    ];

    protected function casts(): array
    {
        return [
            'e_datum_pl' => 'date',
        ];
    }

    public function tips(): HasMany
    {
        return $this->hasMany(ExtraTip::class, 'ex_extra', 'e_id');
    }

    public function type(): ExtraType
    {
        return ExtraType::fromFlags($this->e_zapas, $this->e_muzstva);
    }

    // Platí jen pro ExtraType::Team, kde e_vysledek nese ID týmu (`muzstva.m_id`).
    public function winningTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'e_vysledek', 'm_id');
    }

    public function hasResult(): bool
    {
        return match ($this->type()) {
            ExtraType::Match => $this->e_goly_d !== null && $this->e_goly_h !== null,
            ExtraType::Team, ExtraType::Free => $this->e_vysledek !== null && $this->e_vysledek !== '',
        };
    }
}
