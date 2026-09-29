export const DEFAULT_API_BASE_URL = '/api'

/** Unset or blank falls back to the same-origin default; trailing slashes are dropped. */
export function resolveApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return DEFAULT_API_BASE_URL

  return trimmed.replace(/\/+$/, '')
}

// Vite inlines `import.meta.env` at build time; it's undefined under Jest.
export const API_BASE_URL = resolveApiBaseUrl(import.meta.env?.VITE_API_BASE_URL)
