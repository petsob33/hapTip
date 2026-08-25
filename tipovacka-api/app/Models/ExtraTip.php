<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
