import getMetadata from '../metadata'
import {
  getTitlesWithoutSharedLabels,
  resolveWithoutSharedLabels,
} from '../metadata/sharedLabels'
import { Metadata } from '../metadata/types'

jest.mock('../metadata')

const screening = (cinema: string, title: string) => ({ cinema, title })

describe('getTitlesWithoutSharedLabels', () => {
  const stripped = (...screenings: ReturnType<typeof screening>[]) =>
    Object.fromEntries(getTitlesWithoutSharedLabels(screenings))

  test('removes a prefix that several titles at one cinema share', () => {
    expect(
      stripped(
        screening('Lab111', 'Imagine Film Festival: Donkey Princess'),
        screening('Lab111', 'Imagine Film Festival: History of the Occult'),
        screening('Lab111', 'Imagine Film Festival: Cure'),
        screening('Lab111', 'Goodbye, Lenin!'),
      ),
    ).toEqual({
      'Imagine Film Festival: Donkey Princess': ['Donkey Princess'],
      'Imagine Film Festival: History of the Occult': ['History of the Occult'],
      'Imagine Film Festival: Cure': ['Cure'],
    })
  })

  test('removes a suffix that several titles share', () => {
    expect(
      stripped(
        screening('Lux', 'Coward - Expat Cinema'),
        screening('Lux', 'Blade - Expat Cinema'),
      ),
    ).toEqual({
      'Coward - Expat Cinema': ['Coward'],
      'Blade - Expat Cinema': ['Blade'],
    })
  })

  test('removes a prefix and a parenthesis together', () => {
    expect(
      stripped(
        screening('Lab111', 'Film & Food: Tampopo (Incl. Ramen)'),
        screening('Lab111', 'Film & Food: Shall We Dance? (Incl. Ramen)'),
      ),
    ).toEqual({
      'Film & Food: Tampopo (Incl. Ramen)': ['Tampopo'],
      'Film & Food: Shall We Dance? (Incl. Ramen)': ['Shall We Dance?'],
    })
  })

  test('ignores case and spacing when comparing labels', () => {
    expect(
      stripped(
        screening('Den Haag', 'Human Traffic - No Lonely Dancefloors'),
        screening('Den Haag', 'Dirty Dancing - No Lonely Dance Floors'),
      ),
    ).toEqual({
      'Human Traffic - No Lonely Dancefloors': ['Human Traffic'],
      'Dirty Dancing - No Lonely Dance Floors': ['Dirty Dancing'],
    })
  })

  test('keeps the subtitle of a single film', () => {
    expect(
      stripped(
        screening('Kino', 'Mission: Impossible - Fallout'),
        screening('Kino', 'Spider-Man'),
        screening('Kino', 'Shall We Dance?'),
      ),
    ).toEqual({})
  })

  test('keeps a label that only one title has', () => {
    expect(
      stripped(
        screening('Kino', 'Archined Classic: Hiroshima Mon Amour'),
        screening('Kino', 'The ’70s: Themroc'),
      ),
    ).toEqual({})
  })

  test('does not take a year in parentheses for a label', () => {
    expect(
      stripped(
        screening('Slachtstraat', '3×3 Eyes (1991)'),
        screening(
          'Slachtstraat',
          'Der Held Von Bahnhof Friedrichstrasse (1991)',
        ),
      ),
    ).toEqual({})
  })

  test('counts a label per cinema', () => {
    expect(
      stripped(
        screening('Forum', 'Docs: Naza'),
        screening('Kino', 'Docs: Cutting Through Rocks'),
      ),
    ).toEqual({})
  })

  test('counts a title once, however often it is listed', () => {
    expect(
      stripped(
        screening('Forum', 'Docs: Naza'),
        screening('Forum', 'Docs: Naza'),
      ),
    ).toEqual({})
  })
})

describe('resolveWithoutSharedLabels', () => {
  const lookup = jest.mocked(getMetadata)

  const metadata = (status: Metadata['match']['status']): Metadata => ({
    query: 'docs: naza',
    year: 2026,
    createdAt: '2026-10-07T00:00:00.000Z',
    match: {
      status,
      method: status === 'matched' ? 'tmdb-search' : 'unmatched',
    },
  })

  afterEach(() => lookup.mockReset())

  test('uses the match of the title without the label', async () => {
    lookup.mockResolvedValue({
      ...metadata('matched'),
      query: 'naza',
      movieId: 'tmdb:1',
      title: 'Naza',
    })

    const result = await resolveWithoutSharedLabels(metadata('unmatched'), [
      'Naza',
    ])

    expect(lookup).toHaveBeenCalledWith({ title: 'Naza', year: 2026 })
    expect(result).toMatchObject({
      movieId: 'tmdb:1',
      // the screenings find their metadata by the original query
      query: 'docs: naza',
      year: 2026,
      match: {
        status: 'matched',
        method: 'shared-label',
        strippedTitle: 'Naza',
      },
    })
  })

  test('accepts a manual override of the title without the label', async () => {
    lookup.mockResolvedValue({
      ...metadata('manual'),
      match: { status: 'manual', method: 'manual-override', confidence: 1 },
      movieId: 'tmdb:11239',
    })

    const result = await resolveWithoutSharedLabels(metadata('unmatched'), [
      'Shall We Dance?',
    ])

    expect(result).toMatchObject({
      movieId: 'tmdb:11239',
      query: 'docs: naza',
      match: {
        status: 'manual',
        method: 'manual-override',
        strippedTitle: 'Shall We Dance?',
      },
    })
  })

  test('also retries an ambiguous title', async () => {
    lookup.mockResolvedValue({ ...metadata('matched'), movieId: 'tmdb:1' })

    const result = await resolveWithoutSharedLabels(metadata('ambiguous'), [
      'Naza',
    ])

    expect(result.movieId).toBe('tmdb:1')
  })

  test('keeps the title unmatched when the title without the label does not match either', async () => {
    lookup.mockResolvedValue(metadata('unmatched'))
    const original = metadata('unmatched')

    await expect(
      resolveWithoutSharedLabels(original, ['Naza', 'Other']),
    ).resolves.toBe(original)
    expect(lookup).toHaveBeenCalledTimes(2)
  })

  test.each(['matched', 'manual'] as const)(
    'does not touch a title that is %s',
    async (status) => {
      const original = metadata(status)

      await expect(
        resolveWithoutSharedLabels(original, ['Naza']),
      ).resolves.toBe(original)
      expect(lookup).not.toHaveBeenCalled()
    },
  )
})
