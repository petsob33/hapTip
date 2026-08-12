<?php

namespace App\Http\Controllers\Dev;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Illuminate\View\View;
use ReflectionMethod;
use ReflectionNamedType;

// Dev-only API explorer. Never wired into the `api` middleware group and
// hard-gated to the local environment so it can't leak into staging/prod.
class ApiExplorerController extends Controller
{
    public function index(): View
    {
        abort_unless(App::environment('local'), 404);

        Artisan::call('route:list', ['--json' => true]);
        $rawRoutes = json_decode(Artisan::output(), true) ?? [];

        $endpoints = collect($rawRoutes)
            ->filter(fn (array $route) => Str::startsWith($route['uri'], 'api/'))
            ->map(fn (array $route) => $this->describeRoute($route))
            ->sortBy('uri')
            ->values();

        $groups = $endpoints->groupBy('group');

        return view('dev.api-explorer', ['groups' => $groups]);
    }

    private function describeRoute(array $route): array
    {
        $uri = $route['uri'];
        $httpMethod = $this->firstNonHeadMethod($route['method']);
        $action = $route['action'];
        $middleware = $route['middleware'] ?? [];

        [$controllerClass, $controllerMethod] = Str::contains($action, '@')
            ? explode('@', $action)
            : [null, null];

        preg_match_all('/\{([^}]+)\}/', $uri, $pathMatches);
        $pathParams = array_map(fn (string $p) => rtrim($p, '?'), $pathMatches[1]);

        $bodyRules = [];
        $queryParams = [];

        if ($controllerClass && $controllerMethod && method_exists($controllerClass, $controllerMethod)) {
            $reflection = new ReflectionMethod($controllerClass, $controllerMethod);
            $bodyRules = $this->extractBodyRules($reflection);
            $queryParams = $this->extractQueryParams($reflection);
        }

        $segments = array_values(array_filter(explode('/', $uri)));
        $resourceSegment = $segments[1] ?? 'other';
        $group = in_array($resourceSegment, ['login', 'register', 'user'], true) ? 'auth' : $resourceSegment;

        return [
            'id' => Str::slug($httpMethod.' '.$uri),
            'method' => $httpMethod,
            'uri' => '/'.$uri,
            'name' => $route['name'],
            'action' => $action,
            'middleware' => $middleware,
            'requires_auth' => collect($middleware)->contains(fn (string $m) => str_starts_with($m, 'Illuminate\\Auth\\Middleware\\Authenticate')),
            'requires_admin' => collect($middleware)->contains(fn (string $m) => str_contains($m, 'EnsureUserIsAdmin')),
            'path_params' => $pathParams,
            'query_params' => $queryParams,
            'body_fields' => $bodyRules,
            'example_body' => $this->buildExamplePayload($bodyRules),
            'group' => $group,
        ];
    }

    /**
     * @return array<string, string>
     */
    private function extractBodyRules(ReflectionMethod $reflection): array
    {
        foreach ($reflection->getParameters() as $param) {
            $type = $param->getType();
            if ($type instanceof ReflectionNamedType && ! $type->isBuiltin() && is_subclass_of($type->getName(), FormRequest::class)) {
                try {
                    $formRequestClass = $type->getName();

                    return $this->normalizeRules((new $formRequestClass())->rules());
                } catch (\Throwable) {
                    return [];
                }
            }
        }

        // No FormRequest — fall back to sniffing an inline $request->validate([...]) call.
        $source = $this->readSource($reflection);
        if ($source === null || ! preg_match('/validate\s*\(\s*\[(.*?)\]\s*\)/s', $source, $m)) {
            return [];
        }

        preg_match_all('/[\'"]([a-zA-Z0-9_]+)[\'"]\s*=>\s*[\'"]([^\'"]+)[\'"]/', $m[1], $pairs, PREG_SET_ORDER);

        $rules = [];
        foreach ($pairs as $pair) {
            $rules[$pair[1]] = $pair[2];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    private function normalizeRules(array $rules): array
    {
        $normalized = [];
        foreach ($rules as $field => $rule) {
            $normalized[$field] = is_array($rule) ? implode('|', $rule) : (string) $rule;
        }

        return $normalized;
    }

    /**
     * @return list<string>
     */
    private function extractQueryParams(ReflectionMethod $reflection): array
    {
        $source = $this->readSource($reflection);
        if ($source === null) {
            return [];
        }

        $params = [];
        if (preg_match_all('/request->(?:input|query|has|boolean|integer|string)\(\s*[\'"]([a-zA-Z0-9_]+)[\'"]/', $source, $m)) {
            $params = array_values(array_unique($m[1]));
        }

        if (str_contains($source, '->paginate(') && ! in_array('page', $params, true)) {
            $params[] = 'page';
        }

        return $params;
    }

    private function readSource(ReflectionMethod $reflection): ?string
    {
        $file = $reflection->getFileName();
        if (! $file || ! is_readable($file)) {
            return null;
        }

        $lines = file($file);
        $start = $reflection->getStartLine() - 1;
        $length = $reflection->getEndLine() - $start;

        return implode('', array_slice($lines, $start, $length));
    }

    /**
     * @param array<string, string> $rules
     * @return array<string, mixed>
     */
    private function buildExamplePayload(array $rules): array
    {
        $payload = [];
        foreach ($rules as $field => $rule) {
            $payload[$field] = $this->exampleValue($field, $rule);
        }

        return $payload;
    }

    private function exampleValue(string $field, string $rule): mixed
    {
        if (str_contains($rule, 'email')) {
            return 'user@example.com';
        }

        if (str_contains($rule, 'boolean')) {
            return true;
        }

        if (str_contains($rule, 'date')) {
            return now()->toDateString();
        }

        if (str_contains($rule, 'integer') || str_contains($rule, 'numeric')) {
            return 1;
        }

        if (preg_match('/min:(\d+)/', $rule, $m)) {
            $min = (int) $m[1];
            $base = 'sample';

            return $min > strlen($base) ? str_pad($base, $min, 'x') : $base;
        }

        if (str_contains($rule, 'string')) {
            return 'Sample '.Str::headline($field);
        }

        return '';
    }

    private function firstNonHeadMethod(string $methodList): string
    {
        $methods = array_values(array_filter(explode('|', $methodList), fn (string $m) => $m !== 'HEAD'));

        return $methods[0] ?? $methodList;
    }
}
