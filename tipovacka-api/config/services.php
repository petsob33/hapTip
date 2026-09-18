<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Football API (api-football.com / api-sports.io)
    |--------------------------------------------------------------------------
    |
    | Zdroj výsledků pro ResultsImportService. `leagues` mapuje interní
    | `rocniky.r_liga` na externí `league` ID z API-Football — jen ligy s
    | mapováním jde importovat, ostatní ResultsImportService odmítne s
    | čitelnou chybou. r_liga=1 je český nejvyšší fotbalový svaz (Chance
    | Liga), viz database/database.sqlite.
    |
    */

    'football_api' => [
        'base_url' => env('FOOTBALL_API_BASE_URL', 'https://v3.football.api-sports.io'),
        'key' => env('FOOTBALL_API_KEY'),
        'leagues' => [
            1 => env('FOOTBALL_API_LEAGUE_ID_1'),
        ],
    ],

];
