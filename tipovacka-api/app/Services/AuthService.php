<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

class AuthService
{
    public function register(array $data): NewAccessToken
    {
        // User::create() mass-assigns name/email/password. The User model
        // casts 'password' => 'hashed' (see app/Models/User.php), so the
        // plain-text password is turned into a bcrypt hash automatically
        // right here — the raw password is never written to the database.
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        // createToken() is what Sanctum's HasApiTokens trait gives every
        // User. It inserts a row into personal_access_tokens (storing only
        // a SHA-256 hash of the token) and returns a NewAccessToken object
        // whose ->plainTextToken is the ONLY time the raw token is ever
        // visible. If the caller doesn't save it now, it's gone for good —
        // the same way a password itself isn't recoverable, only resettable.
        return $user->createToken('api');
    }

    public function login(array $data): NewAccessToken
    {
        $user = User::where('email', $data['email'])->first();

        // Hash::check() re-hashes the given plain password with the same
        // algorithm/salt info stored in the hash and compares them — you
        // can never reverse a hash back into a password, only check a guess
        // against it. We check user-exists and password-matches in a single
        // condition and throw the SAME error for both, so a client can't
        // use this endpoint to enumerate which emails have an account.
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Login issues a brand new token rather than reusing an old one.
        // This is intentional: each login = a new "session" the user could
        // later revoke independently (e.g. logging out just one device),
        // without affecting tokens issued to their other devices.
        return $user->createToken('api');
    }
}
