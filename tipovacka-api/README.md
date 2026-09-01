# HAPTIP

Sports prediction ("tipovačka") API for a private football-tipping league — players predict match scores, points are awarded automatically once results are entered, and everyone competes on a season leaderboard. REST backend, no bundled frontend.

## Tech stack

- PHP 8.3 · Laravel 13 · Laravel Sanctum (token auth)
- MySQL (legacy schema) for production, SQLite for local dev
- PHPUnit feature tests

## Features

- Token-based register/login via Sanctum, with a generic error message on both wrong email and wrong password to prevent user enumeration
- Match management (admin-only create/update) with automatic scoring on result entry — exact score = 5 pts, correct goal-difference direction = 1 pt
- Per-player, per-season predictions ("tips") with pagination and filtering
- Season leaderboard aggregated from player points
- Role-gated admin actions via a dedicated `EnsureUserIsAdmin` middleware

## Technical notes

- The database is a MySQL schema from 2006 that could not be redesigned. Table and column names stay in Czech (`hraci`, `zapasy`, `h_id`, `z_goly_d`...), several tables have no `created_at`/`updated_at`, and primary keys aren't Laravel's default `id`. Every Eloquent model explicitly declares `$table`, `$primaryKey`, and `$timestamps = false` to work with the existing structure instead of fighting it.
- The legacy `hraci.h_pasw` column stored short plaintext passwords (`varchar(30)`). To layer Sanctum's bcrypt hashing on top without touching existing rows, a migration only widens the column to 255 chars — a small, targeted change instead of a rewrite.
- `Player::getAuthPassword()` is overridden because Laravel's auth guard expects a `password` field by convention, but the legacy column is `h_pasw`.

## Running locally

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite   # default local DB is SQLite
php artisan migrate
php artisan serve
```

API runs at `http://127.0.0.1:8000/api`. Ready-made requests are in `postman/hapTip.postman_collection.json`.

<!-- TODO: screenshot -->
