# Tipovací aplikace — frontend

Webový frontend nad existujícím Laravel API. API se needituje z tohohle repa.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- TanStack Query (react-query) pro data z API
- React Router
- Nic dalšího nepřidávej bez toho, aby ses zeptal.

## Struktura
- src/api/client.ts — jediné místo, kde se volá fetch
- src/api/types.ts — TS typy entit podle docs/api.md
- src/api/hooks/ — react-query hooky, jeden soubor na entitu
- src/pages/ — jedna složka na obrazovku
- src/components/ — sdílené komponenty

## API
- Kontrakt je v docs/api.md. Je závazný.
- Nevymýšlej endpointy, které tam nejsou. Když nějaký chybí,
  zapiš ho do docs/api-todo.md (cesta, metoda, očekávaný tvar odpovědi
  a proč ho potřebuješ) a obrazovku postav proti mocku.
- Base URL: import.meta.env.VITE_API_URL
- Auth: Bearer token v localStorage pod klíčem "token", 401 → redirect na /login

## Pravidla psaní kódu
- Přímočará řešení před abstrakcemi. Žádné vrstvy "pro budoucnost".
- Žádný globální state manager. Server data = react-query, zbytek useState.
- Každá obrazovka řeší 4 stavy: loading, error, prázdná data, data.
- Formuláře: react-hook-form, validační chyby z API (422) mapuj na pole.
- Komponenty do 150 řádků, pak rozděl.
- Texty v UI česky, kód a komentáře anglicky.

## Co nedělat
- Needituj soubory mimo zadání promptu.
- Nepiš testy, pokud o ně výslovně nepožádám.
- Nespouštěj git commit sám.
- Neměň src/api/client.ts při práci na obrazovce.

## Příkazy
- npm run dev — dev server
- npm run build — build
- npm run lint — ESLint