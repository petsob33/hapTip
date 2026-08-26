<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// `z_rocnik`/`t_rocnik`/`e_rocnik` na zápasech/tipech/extra tipech odkazují
// na r_id z téhle tabulky — nejde o kalendářní rok, ale o konkrétní ročník
// (domácí sezóna jako "2025-26", nebo turnaj jako "ME 2016").
class Rocnik extends Model
{
    protected $table = 'rocniky';

    protected $primaryKey = 'r_id';

    public $timestamps = false;

    protected $fillable = [
        'r_rocnik',
        'r_liga',
    ];
}
