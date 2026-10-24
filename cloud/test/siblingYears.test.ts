import {
  needsSiblingYearRetry,
  resolveWithSiblingYears,
} from '../metadata/siblingYears'
import type { Metadata } from '../metadata/types'

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

describe('resolveWithSiblingYears', () => {
  const lookup = (
    year: number | undefined,
    match: Metadata['match'],
    movieId?: string,
  ): Metadata => ({
    query: 'leviathan',
    year,
    createdAt: '2026-10-24T00:00:00.000Z',
    movieId,
    match,
  })

  const unmatched = { status: 'unmatched', method: 'unmatched' } as const

  test('retries a lookup with the years that the same title matched', async () => {
    const retry = jest.fn(async () =>
      lookup(undefined, matched(false), 'tmdb:265180'),
    )

    const resolved = await resolveWithSiblingYears(
      [
        lookup(2014, matched(false), 'tmdb:265180'),
        lookup(undefined, matched(true), 'tmdb:14372'),
      ],
      retry,
    )

    expect(retry).toHaveBeenCalledTimes(1)
    expect(retry).toHaveBeenCalledWith({
      title: 'leviathan',
      year: undefined,
      siblingYearHints: [2014],
    })
    expect(resolved.map(({ movieId }) => movieId)).toEqual([
      'tmdb:265180',
      'tmdb:265180',
    ])
  })

  test('keeps a lookup when its retry does not match', async () => {
    const retry = jest.fn(async () => lookup(undefined, unmatched))

    const resolved = await resolveWithSiblingYears(
      [
        lookup(2014, matched(false), 'tmdb:265180'),
        lookup(undefined, matched(true), 'tmdb:14372'),
      ],
      retry,
    )

    expect(resolved.map(({ movieId }) => movieId)).toEqual([
      'tmdb:265180',
      'tmdb:14372',
    ])
  })

  test('does not retry without a year to retry with, or for a clear match', async () => {
    const retry = jest.fn()

    const lookups = [
      lookup(undefined, matched(true), 'tmdb:14372'),
      { ...lookup(undefined, unmatched), query: 'cure' },
    ]

    expect(await resolveWithSiblingYears(lookups, retry)).toEqual(lookups)
    expect(retry).not.toHaveBeenCalled()
  })
})
