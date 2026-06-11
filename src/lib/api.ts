import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { PREVIEW_MODE } from '@/lib/preview'
import { mockAdapter } from '@/lib/mock'

/**
 * Central Axios instance for the KravConnect API.
 * Base URL comes from VITE_API_URL (see .env.example).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://api-krav-maga-app.onrender.com',
  headers: { 'Content-Type': 'application/json' },
})

// While previewing without a backend, resolve every request against the
// in-memory mock instead of the network. Disabled once PREVIEW_MODE is off.
if (PREVIEW_MODE) {
  api.defaults.adapter = mockAdapter
}

// Request interceptor: attach the JWT to every outgoing request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

// Response interceptor: clear the session when the token expired. The backend
// answers 400 (not 401) with a bare-string message for JWT failures.
const JWT_ERRORS = new Set(['token jwt invalido', 'Token JWT ausente'])
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data
      const hadToken = Boolean(useAuthStore.getState().token)
      if (
        status === 401 ||
        (status === 400 && hadToken && typeof data === 'string' && JWT_ERRORS.has(data))
      ) {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  },
)

/**
 * Normalizes a list response into a plain array. Backends vary between
 * returning a bare array or wrapping it as `{ data: [...] }` / `{ items: [...] }`.
 */
export function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const key of ['data', 'items', 'requests', 'students', 'result']) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
  }
  return []
}

/** Extracts a human-friendly message from an API/Axios error. */
export function getErrorMessage(
  err: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    // The backend returns errors as a bare JSON string, e.g. "CNPJ invalido".
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
      const obj = data as { message?: string; error?: string }
      return obj.message ?? obj.error ?? err.message ?? fallback
    }
    return err.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
