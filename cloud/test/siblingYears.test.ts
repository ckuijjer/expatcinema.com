import { needsSiblingYearRetry } from '../metadata/siblingYears'

const matched = (popularityTieBreak?: boolean) =>
  ({ status: 'matched', method: 'tmdb-search', popularityTieBreak }) as const

describe('needsSiblingYearRetry', () => {
  test('a lookup that did not match is retried', () => {
    expect(
      needsSiblingYearRetry({
        year: 2014,
        match: { status: 'unmatched', method: 'unmatched' },
      }),
    ).toBe(true)
  })

  test('a lookup without a year that was decided by popularity is retried', () => {
    expect(
      needsSiblingYearRetry({ year: undefined, match: matched(true) }),
    ).toBe(true)
  })

  test('a clear match without a year is kept', () => {
    expect(
      needsSiblingYearRetry({ year: undefined, match: matched(false) }),
    ).toBe(false)
    expect(needsSiblingYearRetry({ year: undefined, match: matched() })).toBe(
      false,
    )
  })

  test('a match for a year the cinema gave is kept, whatever decided it', () => {
    expect(needsSiblingYearRetry({ year: 1989, match: matched(true) })).toBe(
      false,
    )
  })
})
