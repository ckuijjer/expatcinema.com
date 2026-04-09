import { parseFkFeedYear } from '../scrapers/utils/parseFkFeedYear'

describe('kinorotterdam', () => {
  test('parses a 4-digit FK feed movie year', () => {
    expect(parseFkFeedYear('2025')).toBe(2025)
  })

  test('returns undefined for empty or invalid FK feed movie years', () => {
    expect(parseFkFeedYear(undefined)).toBeUndefined()
    expect(parseFkFeedYear('')).toBeUndefined()
    expect(parseFkFeedYear('  ')).toBeUndefined()
    expect(parseFkFeedYear('2025/2026')).toBeUndefined()
  })
})
