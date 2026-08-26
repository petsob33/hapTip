import type { ApiErrorResponse } from './types'

/** localStorage klíč pro Sanctum bearer token, viz CLAUDE.md. */
export const TOKEN_KEY = 'token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  body: ApiErrorResponse | null

  constructor(status: number, body: ApiErrorResponse | null) {
    super(body?.message ?? `API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const BASE_URL = import.meta.env.VITE_API_URL

/**
 * Jediné místo, kde se volá fetch. Přidává Bearer token z localStorage,
 * skládá URL z VITE_API_URL a při 401 (chybějící/neplatný token) smaže
 * token a přesměruje na /login.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new ApiError(401, { message: 'Unauthenticated.' })
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorResponse | null)
  }

  return body as T
}
