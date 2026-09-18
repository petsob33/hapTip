<?php

namespace Database\Factories;

use App\Models\Player;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PlayerFactory extends Factory
{
    protected $model = Player::class;

    public function definition(): array
    {
        return [
            'h_jmeno' => $this->faker->firstName(),
            'h_prijmeni' => $this->faker->lastName(),
            'h_nick' => $this->faker->unique()->userName(),
            'h_email' => $this->faker->unique()->safeEmail(),
            'h_pasw' => Str::random(10),
            'h_admin' => 'N',
            'h_platnost' => 'A',
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['h_admin' => 'A']);
    }
}
