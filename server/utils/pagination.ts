const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function positiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) return fallback
  const normalized = Math.floor(value)
  return Number.isSafeInteger(normalized) ? normalized : fallback
}

export function normalizePagination(options?: { page?: number; limit?: number }): {
  page: number
  limit: number
  start: number
} {
  const page = positiveInteger(options?.page, DEFAULT_PAGE)
  const limit = Math.min(positiveInteger(options?.limit, DEFAULT_LIMIT), MAX_LIMIT)
  return { page, limit, start: (page - 1) * limit }
}
