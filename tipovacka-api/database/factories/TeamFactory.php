<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'm_nazev' => $this->faker->unique()->city().' FC',
            'm_mesto' => $this->faker->city(),
            'm_znak' => $this->faker->lexify('?'),
            'm_platnost' => 'A',
            'm_liga' => 1,
        ];
    }
}
