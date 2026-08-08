<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $table = 'muzstva';

    protected $primaryKey = 'm_id';

    public $timestamps = false;
}
