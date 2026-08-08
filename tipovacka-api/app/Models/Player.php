<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Player extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'hraci';

    protected $primaryKey = 'h_id';

    public $timestamps = false;

    protected $fillable = [
        'h_jmeno',
        'h_prijmeni',
        'h_nick',
        'h_email',
        'h_pasw',
        'h_admin',
        'h_platnost',
    ];

    protected $hidden = [
        'h_pasw',
    ];

    protected function casts(): array
    {
        return [
            'h_pasw' => 'hashed',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->h_pasw;
    }
}
