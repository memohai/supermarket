import { describe, expect, test } from 'bun:test'
import { normalizePagination } from './pagination.ts'

describe('normalizePagination', () => {
  test('uses defaults for missing or invalid values', () => {
    expect(normalizePagination()).toEqual({ page: 1, limit: 20, start: 0 })
    expect(normalizePagination({ page: Number.NaN, limit: -5 })).toEqual({
      page: 1,
      limit: 20,
      start: 0,
    })
    expect(normalizePagination({ page: Number.MAX_VALUE })).toEqual({
      page: 1,
      limit: 20,
      start: 0,
    })
  })

  test('normalizes fractions and caps large limits', () => {
    expect(normalizePagination({ page: 2.9, limit: 500 })).toEqual({
      page: 2,
      limit: 100,
      start: 100,
    })
  })
})
