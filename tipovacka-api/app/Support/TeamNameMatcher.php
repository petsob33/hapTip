<?php

namespace App\Support;

/**
 * Normalizace a porovnávání jmen týmů, sdílené mezi ResultsImportService
 * (API-Football) a ManualResultsImportService (ruční vložení textem) — oba
 * potřebují spárovat cizí/napsaný název s interním `muzstva.m_nazev`.
 */
class TeamNameMatcher
{
    public static function normalize(string $name): string
    {
        $name = mb_strtolower($name);
        $name = iconv('UTF-8', 'ASCII//TRANSLIT', $name) ?: $name;
        // Časté prefixy českých klubových názvů, které kratší/cizí zápis
        // obvykle nemá (např. "AC Sparta Praha" vs. "Sparta").
        $name = preg_replace('/\b(1\.|fc|sk|ac|fk|mfk|sfc|sc)\b/', '', $name);
        $name = preg_replace('/[^a-z0-9]+/', ' ', $name);

        return trim(preg_replace('/\s+/', ' ', $name));
    }

    /**
     * Rezervní/B-tým ("Slavia Praha B", "Sparta Praha II", "Sparta Praha
     * rezerva") sdílí většinu jména s áčkem, takže similar_text() na
     * normalizovaných řetězcích dá vysokou shodu, i když jde o jiný tým.
     * similarity() proto tenhle příznak kontroluje zvlášť, ne jako součást
     * normalize() — normalize() zůstává čistě textová normalizace.
     */
    private static function hasReserveMarker(string $normalized): bool
    {
        return (bool) preg_match('/\b(b|ii|rezerva)$/', $normalized);
    }

    /** Shoda 0–100, viz `similar_text()`. */
    public static function similarity(string $a, string $b): float
    {
        $normalizedA = self::normalize($a);
        $normalizedB = self::normalize($b);

        // Jeden název nese značku rezervy a druhý ne → jiný tým bez ohledu
        // na to, jak podobně zbytek jména vypadá.
        if (self::hasReserveMarker($normalizedA) !== self::hasReserveMarker($normalizedB)) {
            return 0.0;
        }

        similar_text($normalizedA, $normalizedB, $percent);

        return $percent;
    }
}
