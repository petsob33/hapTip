<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtraTip extends Model
{
    protected $table = 'extratipy';

    protected $primaryKey = 'ex_id';

    public $timestamps = false;

    protected $fillable = [
        'ex_extra',
        'ex_hrac',
        'ex_tip',
        'ex_tip_d',
        'ex_tip_h',
        'ex_body',
        'ex_datum',
        'ex_rocnik',
    ];

    protected function casts(): array
    {
        return [
            'ex_datum' => 'date',
        ];
    }

    public function extra(): BelongsTo
    {
        return $this->belongsTo(Extra::class, 'ex_extra', 'e_id');
    }

    // Platí jen pro ExtraType::Team, kde ex_tip nese ID týmu (`muzstva.m_id`).
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'ex_tip', 'm_id');
    }
}
