import getMetadata from '../metadata'
import { resolveWithDoubleFeature } from '../metadata/doubleFeature'
import { Metadata } from '../metadata/types'

jest.mock('../metadata')

const lookup = jest.mocked(getMetadata)

const unmatched = (query = 'man of marble / man of iron'): Metadata => ({
  query,
  createdAt: '2026-10-25T00:00:00.000Z',
  match: { status: 'unmatched', method: 'unmatched' },
})

const matched = (title: string, id: string): Metadata => ({
  query: title.toLowerCase(),
  createdAt: '2026-10-25T00:00:00.000Z',
  movieId: id,
  title,
  tmdb: { id: Number(id.split(':')[1]), title },
  match: { status: 'matched', method: 'tmdb-search', confidence: 0.925 },
})

const films: Record<string, Metadata> = {
  'Man of Marble': matched('Man of Marble', 'tmdb:224'),
  'Man of Iron': matched('Man of Iron', 'tmdb:225'),
  '5 Centimeters Per Second': matched('5 Centimeters Per Second', 'tmdb:38142'),
  'The Garden of Words': matched('The Garden of Words', 'tmdb:198375'),
}

describe('resolveWithDoubleFeature', () => {
  afterEach(() => lookup.mockReset())

  test('is the films of a title that is the titles of two of them', async () => {
    lookup.mockImplementation(async ({ title }) => films[title] ?? unmatched())

    const { metadata, parts } = await resolveWithDoubleFeature(unmatched(), [
      'Man of Marble / Man of Iron',
    ])

    expect(metadata).toMatchObject({
      movieId: 'tmdb:224',
      query: 'man of marble / man of iron',
      match: {
        status: 'matched',
        method: 'double-feature',
        doubleFeature: ['tmdb:224', 'tmdb:225'],
      },
    })
    expect(parts.map(({ movieId }) => movieId)).toEqual([
      'tmdb:224',
      'tmdb:225',
    ])
  })

  test('looks up the films without the year that comes with them', async () => {
    lookup.mockImplementation(async ({ title }) => films[title] ?? unmatched())

    const { metadata } = await resolveWithDoubleFeature(unmatched(), [
      '5 Centimeters Per Second (2007) / The Garden of Words (2013)',
    ])

    expect(metadata.match).toMatchObject({
      method: 'double-feature',
      doubleFeature: ['tmdb:38142', 'tmdb:198375'],
    })
  })

  test('is not one when a part is no film', async () => {
    lookup.mockImplementation(async ({ title }) => films[title] ?? unmatched())
    const original = unmatched('man of marble / the talk')

    const { metadata, parts } = await resolveWithDoubleFeature(original, [
      'Man of Marble / The Talk',
    ])

    expect(metadata).toBe(original)
    expect(parts).toEqual([])
  })

  test('is not one when both parts are the same film', async () => {
    lookup.mockImplementation(async () => films['Man of Iron'])
    const original = unmatched('man of iron / man of iron')

    const { metadata } = await resolveWithDoubleFeature(original, [
      'Man of Iron / Man of Iron',
    ])

    expect(metadata).toBe(original)
  })

  test('is not one when a part only starts like a film of another title', async () => {
    lookup.mockImplementation(async ({ title }) =>
      title === 'Marble'
        ? films['Man of Marble']
        : title === 'Man of Iron'
          ? films['Man of Iron']
          : unmatched(),
    )
    const original = unmatched('marble / man of iron')

    const { metadata } = await resolveWithDoubleFeature(original, [
      'Marble / Man of Iron',
    ])

    expect(metadata).toBe(original)
  })

  test('leaves a title that matched, or has more than two parts, alone', async () => {
    const done = films['Man of Iron']
    await expect(resolveWithDoubleFeature(done, ['A / B'])).resolves.toEqual({
      metadata: done,
      parts: [],
    })

    const original = unmatched('a / b / c')
    await expect(
      resolveWithDoubleFeature(original, ['Alpha / Beta / Gamma']),
    ).resolves.toEqual({ metadata: original, parts: [] })
    expect(lookup).not.toHaveBeenCalled()
  })
})
