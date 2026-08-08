# Tipovačka API — jak appka funguje

## Jak jde požadavek skrz appku

```
Klient (Postman/frontend)
   │  POST /api/tipy  { zapas_id, goly_domaci, goly_hoste }
   ▼
routes/api.php               ← "která URL vede kam"
   │  Route::post('/tipy', [TipController::class, 'store'])
   ▼
app/Http/Requests/StoreTipRequest.php   ← VALIDACE vstupu
   │  než se vůbec dostane do controlleru, Laravel zkontroluje
   │  pravidla z rules(). Když neprojde, appka sama vrátí 422 s chybami.
   ▼
app/Http/Controllers/TipController.php  ← "recepční"
   │  jen přijme request, zavolá Service, vrátí odpověď.
   │  ŽÁDNÁ byznys logika sem nepatří.
   ▼
app/Services/TipService.php             ← MOZEK appky
   │  vytvorTip() — kontroluje, jestli zápas už nezačal,
   │  a teprve pak zapisuje do DB přes Model.
   ▼
app/Models/Tip.php, Zapas.php           ← "tabulka jako objekt"
   │  Tip::create([...]) = INSERT INTO tips ...
   ▼
app/Http/Resources/TipResource.php      ← formátování odpovědi
        vezme Eloquent objekt a udělá z něj přesně definovaný JSON
        (nevrací třeba celý model se sloupci, co nechceš ukazovat)
```

## Kam co psát

| Chci... | Píšu do |
|---|---|
| Přidat nový endpoint (URL) | `routes/api.php` |
| Nová validace vstupu (např. `StoreZapasRequest`) | `app/Http/Requests/` |
| Nová logika/výpočet (např. přidělování bodů za tip) | `app/Services/` |
| Nová tabulka v DB | `database/migrations/` + `app/Models/` |
| Formát JSON odpovědi | `app/Http/Resources/` |
| Přijetí requestu a zavolání service | `app/Http/Controllers/` |

Pravidlo: **Controller je tenký** (jen orchestruje), **Service má logiku**, **Model je jen datová vrstva**.

## Jak appku spustit

Composer je nainstalovaný jen jako `composer.phar` ve scratchpadu, ne systémově — pro běžnou práci to nevadí, `php artisan` funguje bez composeru.

```bash
cd /var/www/html/pokusy/hapTip/tipovacka-api
php artisan serve
```

Appka poběží na `http://127.0.0.1:8000`. Endpoint na tipy bude na `http://127.0.0.1:8000/api/tipy`.

## Jak endpoint otestovat

Endpoint `/api/tipy` je za `auth:sanctum`, takže bez tokenu dostaneš 401.

1. **Vytvořit uživatele a token** (přes `php artisan tinker`):

```bash
php artisan tinker
```

```php
$user = \App\Models\User::factory()->create();
$token = $user->createToken('test')->plainTextToken;
echo $token;
```

2. **Vytvořit testovací zápas** (protože `zapas_id` musí existovat v tabulce `zapasy`):

```php
$zapas = \App\Models\Zapas::create([
    'tym_domaci' => 'Sparta',
    'tym_hoste' => 'Slavia',
    'cas_vykopu' => now()->addHour(),
]);
```

3. **Poslat request** s hlavičkou `Authorization: Bearer <token>`:

```bash
curl -X POST http://127.0.0.1:8000/api/tipy \
  -H "Authorization: Bearer TVUJ_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"zapas_id": 1, "goly_domaci": 2, "goly_hoste": 1}'
```

Odpověď bude JSON z `TipResource` (id, zapas_id, góly, čas vytvoření), status 201.

## Databáze

Zatím běží na SQLite (`database/database.sqlite`) — nejjednodušší pro vývoj, žádná instalace MariaDB potřeba. Až budeš chtít reálnou MariaDB, stačí v `.env` přepsat:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=tipovacka
DB_USERNAME=...
DB_PASSWORD=...
```

a spustit `php artisan migrate` znovu.
