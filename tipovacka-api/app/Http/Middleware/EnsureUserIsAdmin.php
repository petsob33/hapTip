<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->h_admin !== 'A') {
            abort(403, 'Tato akce je dostupná pouze administrátorům.');
        }

        return $next($request);
    }
}
