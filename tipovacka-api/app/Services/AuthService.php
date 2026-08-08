<?php

namespace App\Services;

use App\Models\Player;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

class AuthService
{
    public function register(array $data): NewAccessToken
    {
        // Player::create() mass-assigns h_jmeno/h_email/h_pasw. The Player
        // model casts 'h_pasw' => 'hashed' (see app/Models/Player.php), so
        // the plain-text password is turned into a bcrypt hash automatically
        // right here — the raw password is never written to the database.
        //
        // Note: the `hraci` table is the real legacy player table (imported
        // from d167769_haptip.sql). Its existing rows store passwords as
        // plain text, from before this app existed — those are left as-is
        // and simply won't match Hash::check() below, so those old accounts
        // can't log in through this endpoint until they re-register.
        $player = Player::create([
            'h_jmeno' => $data['name'],
            'h_email' => $data['email'],
            'h_pasw' => $data['password'],
            'h_admin' => 'N',
            'h_platnost' => 'A',
        ]);

        // createToken() is what Sanctum's HasApiTokens trait gives every
        // Player. It inserts a row into personal_access_tokens (storing only
        // a SHA-256 hash of the token) and returns a NewAccessToken object
        // whose ->plainTextToken is the ONLY time the raw token is ever
        // visible. If the caller doesn't save it now, it's gone for good —
        // the same way a password itself isn't recoverable, only resettable.
        return $player->createToken('api');
    }

    public function login(array $data): NewAccessToken
    {
        $player = Player::where('h_email', $data['email'])->first();

        // Some rows in `hraci` predate this app and still store their
        // original plain-text password (e.g. 'rambo159') instead of a
        // bcrypt hash. Hash::check() throws on a value it doesn't recognise
        // as its own format, so those legacy passwords are treated as a
        // non-match up front rather than passed to it — same end result
        // (login rejected) without the crash.
        $hasBcryptPassword = $player && Str::startsWith($player->h_pasw, '$2y$');

        // Hash::check() re-hashes the given plain password with the same
        // algorithm/salt info stored in the hash and compares them — you
        // can never reverse a hash back into a password, only check a guess
        // against it. We check user-exists and password-matches in a single
        // condition and throw the SAME error for both, so a client can't
        // use this endpoint to enumerate which emails have an account.
        if (! $hasBcryptPassword || ! Hash::check($data['password'], $player->h_pasw)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Login issues a brand new token rather than reusing an old one.
        // This is intentional: each login = a new "session" the user could
        // later revoke independently (e.g. logging out just one device),
        // without affecting tokens issued to their other devices.
        return $player->createToken('api');
    }
}
