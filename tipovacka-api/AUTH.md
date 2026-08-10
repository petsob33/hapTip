# Autentizace — jak to má fungovat

Tenhle dokument popisuje **návrh** auth vrstvy appky: proč vypadá tak, jak vypadá, a co
každý kousek řeší. Implementace je v `app/Http/Requests/{Register,Login}Request.php`,
`app/Services/AuthService.php` a `app/Http/Controllers/AuthController.php` — soubory jsou
schválně minimální a okomentované anglicky (proč jednotlivé řádky existují), tenhle
dokument je širší obrázek nad nimi.

## Problém, který auth řeší

API je bezstavové (žádná session mezi requesty). Každý request tedy musí sám o sobě nést
důkaz, kdo ho posílá — jinak `TipController` neví, komu tip patří. Řešení: **token**.
Klient si ho jednou vyžádá a pak ho posílá v každém dalším requestu v hlavičce
`Authorization: Bearer <token>`.

## Dvě fáze: získání tokenu vs. použ

Proto `/register` a `/login` v `routes/api.php` **nejsou** za middlewarem `auth:sanctum` —
byl by to slepý kruh (potřeboval bys token, abys token získal).

## Návrh route → request → service → response

```
routes/api.php
   │  POST /api/register  → AuthController::register
   │  POST /api/login     → AuthController::login
   ▼
RegisterRequest / LoginRequest     ← validace VSTUPU, ne hesla samotného
   │  register: name, email (musí být unikátní), password (min 8 znaků)
   │  login:    email, password (bez "exists:users" – viz níže "Proč")
   ▼
AuthController                     ← tenký, jen předá data službě
   │  register() → AuthService::registrovat()
   │  login()    → AuthService::prihlasit()
   ▼
AuthService                        ← MOZEK: hashování hesla, ověření, vydání tokenu
   │  registrovat(): User::create() (heslo se zahashuje automaticky přes cast
   │                 'password' => 'hashed' v User modelu) → createToken()
   │  prihlasit():   najde User podle emailu, Hash::check() proti uloženému
   │                 hashi → createToken()
   ▼
JSON odpověď  { "token": "1|abcDEF..." }
```

## Proč jsou rozhodnutí udělaná tak, jak jsou

**Proč `LoginRequest` nekontroluje, že email existuje (`exists:users`)?**
Kdyby appka vracela jinou chybu pro "email neexistuje" a jinou pro "heslo nesedí",
útočník by mohl zkoušet emaily a poznat, které jsou zaregistrované (tzv. *user
enumeration*). Proto `AuthService::prihlasit()` obě situace spojuje do jedné podmínky a
vrací **stejnou** obecnou chybu pro oba případy.

**Proč appka nikdy neporovnává hesla přímo (`if ($heslo === $ulozeneHeslo)`)?**
Protože se v databázi neukládá heslo, ale jeho **hash** (`Hash::make()`, respektive
automaticky přes cast `'password' => 'hashed'` na `User` modelu). Hash je jednosměrná
funkce — nejde z něj heslo zpětně získat. `Hash::check($zadane, $ulozenyHash)` zahashuje
zadané heslo stejným algoritmem a porovná výsledky.

**Proč `createToken()` a ne návrat k session/cookie?**
Appka je čisté API bez frontendu (viz `routes/web.php` — jen jedna welcome stránka).
Token v hlavičce funguje bez cookies, bez CSRF řešení, a hodí se pro libovolného klienta
(curl, mobilní appka, SPA na jiné doméně).

**Proč `login()` pokaždé vydá nový token, místo aby vracel starý?**
Každý token = jedno nezávislé "přihlášení" (např. jedno zařízení). Uživatel tak může
později smazat token jednoho zařízení (`$user->tokens()->where(...)->delete()`), aniž by
odhlásil ostatní.

## Co v návrhu chybí (vědomě, je to základ na pochopení principu)

- **Odhlášení** (`DELETE /api/logout` → smazat `$request->user()->currentAccessToken()`).
- **Rate limiting** na `/login` proti zkoušení hesel na hrubou sílu.
- **Ověření emailu** (appka teď věří libovolnému zadanému emailu).
- Vlastní **autorizace** (`abilities` na tokenu, role) — momentálně každý přihlášený
  uživatel smí vše, co API nabízí (viz `authorize(): bool { return true; }` napříč
  Request třídami).

Proto `/register` a `/login` v `routes/api.php` **nejsou** za middlewarem `auth:sanctum` —
byl by to slepý kruh (potřeboval bys token, abys token získal).

## Návrh route → request → service → response

```
routes/api.php
   │  POST /api/register  → AuthController::register
   │  POST /api/login     → AuthController::login
   ▼
RegisterRequest / LoginRequest     ← validace VSTUPU, ne hesla samotného
   │  register: name, email (musí být unikátní), password (min 8 znaků)
   │  login:    email, password (bez "exists:users" – viz níže "Proč")
   ▼
AuthController                     ← tenký, jen předá data službě
   │  register() → AuthService::registrovat()
   │  login()    → AuthService::prihlasit()
   ▼
AuthService                        ← MOZEK: hashování hesla, ověření, vydání tokenu
   │  registrovat(): User::create() (heslo se zahashuje automaticky přes cast
   │                 'password' => 'hashed' v User modelu) → createToken()
   │  prihlasit():   najde User podle emailu, Hash::check() proti uloženému
   │                 hashi → createToken()
   ▼
JSON odpověď  { "token": "1|abcDEF..." }
```

## Proč jsou rozhodnutí udělaná tak, jak jsou

**Proč `LoginRequest` nekontroluje, že email existuje (`exists:users`)?**
Kdyby appka vracela jinou chybu pro "email neexistuje" a jinou pro "heslo nesedí",
útočník by mohl zkoušet emaily a poznat, které jsou zaregistrované (tzv. *user
enumeration*). Proto `AuthService::prihlasit()` obě situace spojuje do jedné podmínky a
vrací **stejnou** obecnou chybu pro oba případy.

**Proč appka nikdy neporovnává hesla přímo (`if ($heslo === $ulozeneHeslo)`)?**
Protože se v databázi neukládá heslo, ale jeho **hash** (`Hash::make()`, respektive
automaticky přes cast `'password' => 'hashed'` na `User` modelu). Hash je jednosměrná
funkce — nejde z něj heslo zpětně získat. `Hash::check($zadane, $ulozenyHash)` zahashuje
zadané heslo stejným algoritmem a porovná výsledky.

**Proč `createToken()` a ne návrat k session/cookie?**
Appka je čisté API bez frontendu (viz `routes/web.php` — jen jedna welcome stránka).
Token v hlavičce funguje bez cookies, bez CSRF řešení, a hodí se pro libovolného klienta
(curl, mobilní appka, SPA na jiné doméně).

**Proč `login()` pokaždé vydá nový token, místo aby vracel starý?**
Každý token = jedno nezávislé "přihlášení" (např. jedno zařízení). Uživatel tak může
později smazat token jednoho zařízení (`$user->tokens()->where(...)->delete()`), aniž by
odhlásil ostatní.

## Co v návrhu chybí (vědomě, je to základ na pochopení principu)

- **Odhlášení** (`DELETE /api/logout` → smazat `$request->user()->currentAccessToken()`).
- **Rate limiting** na `/login` proti zkoušení hesel na hrubou sílu.
- **Ověření emailu** (appka teď věří libovolnému zadanému emailu).
- Vlastní **autorizace** (`abilities` na tokenu, role) — momentálně každý přihlášený
  uživatel smí vše, co API nabízí (viz `authorize(): bool { return true; }` napříč
  Request třídami).

Než tohle přidávat, vyplatí se nejdřív si na existujícím základu ověřit, že rozumíš, *proč*
je tam co je — to je účel tohoto dokumentu i komentářů v kódu.


Než tohle přidávat, vyplatí se nejdřív si na existujícím základu ověřit, že rozumíš, *proč*
je tam co je — to je účel tohoto dokumentu i komentářů v kódu.
ití tokenu

```
FÁZE 1 — získání tokenu (bez tokenu, protože ho ještě nemáš)
  POST /api/register  { name, email, password }  →  201 { token }
  POST /api/login      { email, password }        →  200 { token }

FÁZE 2 — použití tokenu (na všechno ostatní)
  POST /api/tipy       Authorization: Bearer <token>  →  201 / 401
```

Proto `/register` a `/login` v `routes/api.php` **nejsou** za middlewarem `auth:sanctum` —
byl by to slepý kruh (potřeboval bys token, abys token získal).

## Návrh route → request → service → response

```
routes/api.php
   │  POST /api/register  → AuthController::register
   │  POST /api/login     → AuthController::login
   ▼
RegisterRequest / LoginRequest     ← validace VSTUPU, ne hesla samotného
   │  register: name, email (musí být unikátní), password (min 8 znaků)
   │  login:    email, password (bez "exists:users" – viz níže "Proč")
   ▼
AuthController                     ← tenký, jen předá data službě
   │  register() → AuthService::registrovat()
   │  login()    → AuthService::prihlasit()
   ▼
AuthService                        ← MOZEK: hashování hesla, ověření, vydání tokenu
   │  registrovat(): User::create() (heslo se zahashuje automaticky přes cast
   │                 'password' => 'hashed' v User modelu) → createToken()
   │  prihlasit():   najde User podle emailu, Hash::check() proti uloženému
   │                 hashi → createToken()
   ▼
JSON odpověď  { "token": "1|abcDEF..." }
```

## Proč jsou rozhodnutí udělaná tak, jak jsou

**Proč `LoginRequest` nekontroluje, že email existuje (`exists:users`)?**
Kdyby appka vracela jinou chybu pro "email neexistuje" a jinou pro "heslo nesedí",
útočník by mohl zkoušet emaily a poznat, které jsou zaregistrované (tzv. *user
enumeration*). Proto `AuthService::prihlasit()` obě situace spojuje do jedné podmínky a
vrací **stejnou** obecnou chybu pro oba případy.

**Proč appka nikdy neporovnává hesla přímo (`if ($heslo === $ulozeneHeslo)`)?**
Protože se v databázi neukládá heslo, ale jeho **hash** (`Hash::make()`, respektive
automaticky přes cast `'password' => 'hashed'` na `User` modelu). Hash je jednosměrná
funkce — nejde z něj heslo zpětně získat. `Hash::check($zadane, $ulozenyHash)` zahashuje
zadané heslo stejným algoritmem a porovná výsledky.

**Proč `createToken()` a ne návrat k session/cookie?**
Appka je čisté API bez frontendu (viz `routes/web.php` — jen jedna welcome stránka).
Token v hlavičce funguje bez cookies, bez CSRF řešení, a hodí se pro libovolného klienta
(curl, mobilní appka, SPA na jiné doméně).

**Proč `login()` pokaždé vydá nový token, místo aby vracel starý?**
Každý token = jedno nezávislé "přihlášení" (např. jedno zařízení). Uživatel tak může
později smazat token jednoho zařízení (`$user->tokens()->where(...)->delete()`), aniž by
odhlásil ostatní.

## Co v návrhu chybí (vědomě, je to základ na pochopení principu)

- **Odhlášení** (`DELETE /api/logout` → smazat `$request->user()->currentAccessToken()`).
- **Rate limiting** na `/login` proti zkoušení hesel na hrubou sílu.
- **Ověření emailu** (appka teď věří libovolnému zadanému emailu).
- Vlastní **autorizace** (`abilities` na tokenu, role) — momentálně každý přihlášený
  uživatel smí vše, co API nabízí (viz `authorize(): bool { return true; }` napříč
  Request třídami).

Než tohle přidávat, vyplatí se nejdřív si na existujícím základu ověřit, že rozumíš, *proč*
je tam co je — to je účel tohoto dokumentu i komentářů v kódu.
