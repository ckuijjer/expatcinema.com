import getMetadata from '../metadata'
import { resolveWithTitleParts } from '../metadata/titleParts'
import { Metadata } from '../metadata/types'

jest.mock('../metadata')

const lookup = jest.mocked(getMetadata)

const unmatched = (year?: number): Metadata => ({
  query: 'cine kilo: blade',
  year,
  createdAt: '2026-10-07T00:00:00.000Z',
  match: { status: 'unmatched', method: 'unmatched' },
})

const matched = (title: string, releaseYear: string, id: string): Metadata => ({
  query: title.toLowerCase(),
  createdAt: '2026-10-07T00:00:00.000Z',
  movieId: id,
  title,
  tmdb: {
    id: Number(id.split(':')[1]),
    title,
    releaseDate: `${releaseYear}-01-01`,
  },
  match: { status: 'matched', method: 'tmdb-search', confidence: 1 },
})

describe('resolveWithTitleParts', () => {
  afterEach(() => lookup.mockReset())

  test('uses the part that is the title of a film of that year', async () => {
    lookup.mockImplementation(async ({ title }) =>
      title === 'Blade'
        ? matched('Blade', '1998', 'tmdb:36647')
        : unmatched(1998),
    )

    const result = await resolveWithTitleParts(unmatched(1998), [
      'Cine Kilo: Blade',
    ])

    expect(result).toMatchObject({
      movieId: 'tmdb:36647',
      query: 'cine kilo: blade',
      year: 1998,
      match: {
        status: 'matched',
        method: 'title-part',
        strippedTitle: 'Blade',
      },
    })
  })

  test('needs a year', async () => {
    const original = unmatched()

    await expect(
      resolveWithTitleParts(original, ['Cine Kilo: Blade']),
    ).resolves.toBe(original)
    expect(lookup).not.toHaveBeenCalled()
  })

  test('ignores a film from another year', async () => {
    lookup.mockResolvedValue(matched('Blade', '1998', 'tmdb:36647'))
    const original = unmatched(2015)

    await expect(
      resolveWithTitleParts(original, ['Cine Kilo: Blade']),
    ).resolves.toBe(original)
  })

  test('ignores a part that only starts a longer title', async () => {
    // "National Theatre Live" is the start of "National Theatre Live: All's
    // Well That Ends Well", released in the same year as the screening
    lookup.mockImplementation(async ({ title }) =>
      title === 'National Theatre Live'
        ? matched(
            "National Theatre Live: All's Well That Ends Well",
            '2009',
            'tmdb:407053',
          )
        : unmatched(2009),
    )
    const original = unmatched(2009)

    await expect(
      resolveWithTitleParts(original, ['National Theatre Live: Fleabag']),
    ).resolves.toBe(original)
  })

  test('gives up when the parts point to different films', async () => {
    lookup.mockImplementation(async ({ title }) =>
      title === 'Giant'
        ? matched('Giant', '2026', 'tmdb:1')
        : matched('The Play', '2026', 'tmdb:2'),
    )
    const original = unmatched(2026)

    await expect(
      resolveWithTitleParts(original, ['Giant - The Play']),
    ).resolves.toBe(original)
  })

  test.each(['matched', 'manual'] as const)(
    'does not touch a title that is %s',
    async (status) => {
      const original = {
        ...unmatched(1998),
        match: { status, method: 'tmdb-search' as const },
      }

      await expect(
        resolveWithTitleParts(original, ['Cine Kilo: Blade']),
      ).resolves.toBe(original)
      expect(lookup).not.toHaveBeenCalled()
    },
  )

  test('leaves a title without a delimiter alone', async () => {
    const original = unmatched(1998)

    await expect(resolveWithTitleParts(original, ['Blade'])).resolves.toBe(
      original,
    )
    expect(lookup).not.toHaveBeenCalled()
  })
})
