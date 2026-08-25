<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
}
