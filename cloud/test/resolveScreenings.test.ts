import { resolveScreenings } from '../pipeline/resolve'
import { getMetadataLookupKey } from '../metadata/titleResolver'
import type { Metadata } from '../metadata/types'
import { logger } from '../powertools'
import { Screening } from '../types'

const screening = (overrides: Partial<Screening>): Screening => ({
  title: 'Possession',
  year: 1981,
  director: 'Andrzej Żuławski',
  url: 'https://example.com/possession',
  cinema: 'Lantarenvenster',
  date: new Date('2026-12-10T18:00:00Z'),
  ...overrides,
})

const matchedPossession: Metadata = {
  query: 'possession',
  year: 1981,
  createdAt: '2026-10-24T00:00:00.000Z',
  movieId: 'tmdb:21484',
  imdbId: 'tt0082933',
  title: 'Possession',
  originalTitle: 'Possession',
  tmdb: { id: 21484, releaseDate: '1981-05-27' } as Metadata['tmdb'],
  match: { status: 'matched', method: 'tmdb-search', confidence: 1 },
}

const unmatchedCure: Metadata = {
  query: 'unknown film',
  year: undefined,
  createdAt: '2026-10-24T00:00:00.000Z',
  match: { status: 'unmatched', method: 'unmatched' },
}

const metadataLookups = new Map([
  [
    getMetadataLookupKey('Possession', 1981),
    {
      query: 'possession',
      year: 1981,
      rawTitles: new Set(['Possession']),
    },
  ],
  [
    getMetadataLookupKey('Unknown Film'),
    { query: 'unknown film', rawTitles: new Set(['Unknown Film']) },
  ],
])

describe('resolveScreenings', () => {
  const screenings = [
    screening({}),
    screening({
      url: 'https://example.com/unknown',
      title: 'Unknown Film',
      year: undefined,
      director: undefined,
      event: 'Filmcollege',
      notes: ['Q&A'],
    }),
  ]

  const resolved = resolveScreenings(screenings, {
    metadata: [matchedPossession, unmatchedCure],
    metadataLookups,
  })

  test('adds the movieId to a screening and removes the director', () => {
    const possession = resolved.screenings.find(
      ({ title }) => title === 'Possession',
    )

    expect(possession).toEqual({
      title: 'Possession',
      year: 1981,
      url: 'https://example.com/possession',
      cinema: 'Lantarenvenster',
      date: new Date('2026-12-10T18:00:00Z'),
      movieId: 'tmdb:21484',
    })
    expect(possession).not.toHaveProperty('director')
  })

  test('keeps the event and notes, and has no movieId for an unmatched title', () => {
    expect(
      resolved.screenings.find(({ title }) => title === 'Unknown Film'),
    ).toMatchObject({
      event: 'Filmcollege',
      notes: ['Q&A'],
      movieId: undefined,
    })
  })

  test('builds a movie for the matched lookup only', () => {
    expect(resolved.movies.map(({ movieId }) => movieId)).toEqual([
      'tmdb:21484',
    ])
  })

  test('has a record for every lookup, with the titles of the cinemas', () => {
    expect(resolved.titleMatches).toEqual([
      expect.objectContaining({
        query: 'possession',
        titleRaw: 'Possession',
        titleRawVariants: ['Possession'],
        movieId: 'tmdb:21484',
        tmdbId: 21484,
      }),
      expect.objectContaining({
        query: 'unknown film',
        titleRaw: 'Unknown Film',
        movieId: undefined,
      }),
    ])
  })

  test('lists what to review', () => {
    expect(resolved.review.unmatched.map(({ query }) => query)).toEqual([
      'unknown film',
    ])
    expect(resolved.review.ambiguous).toEqual([])
    expect(resolved.review.directorDisagreements).toEqual([])
  })

  test('lists a match whose director disagrees', () => {
    const disagreeing = {
      ...matchedPossession,
      match: { ...matchedPossession.match, directorMatch: 'disagree' as const },
    }

    expect(
      resolveScreenings(screenings, {
        metadata: [disagreeing],
        metadataLookups,
      }).review.directorDisagreements.map(({ movieId }) => movieId),
    ).toEqual(['tmdb:21484'])
  })

  test('gives movies that share a slug a unique one, with a warning', () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation()
    const imago = (tmdbId: number, year: number, releaseDate: string) =>
      ({
        query: 'imago',
        year,
        createdAt: '2026-10-24T00:00:00.000Z',
        movieId: `tmdb:${tmdbId}`,
        title: 'Imago',
        tmdb: { id: tmdbId, releaseDate },
        match: { status: 'matched', method: 'tmdb-search', confidence: 1 },
      }) as Metadata

    const { movies } = resolveScreenings([], {
      metadata: [
        imago(1119539, 2025, '2025-10-22'),
        imago(1722186, 2026, '2026-03-01'),
      ],
      metadataLookups: new Map(),
    })

    expect(movies.map(({ slug }) => slug)).toEqual(['imago', 'imago-2026'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'movies share a slug',
      expect.objectContaining({
        slug: 'imago',
        movies: [
          expect.objectContaining({ movieId: 'tmdb:1119539' }),
          expect.objectContaining({ movieId: 'tmdb:1722186' }),
        ],
      }),
    )
    warn.mockRestore()
  })

  describe('an event found in the title', () => {
    const docs = (title: string, overrides: Partial<Screening> = {}) =>
      screening({
        title,
        year: undefined,
        director: undefined,
        cinema: 'Rialto',
        url: `https://example.com/${title}`,
        ...overrides,
      })

    const lookup = (query: string, rawTitle: string) =>
      [
        getMetadataLookupKey(rawTitle),
        { query, rawTitles: new Set([rawTitle]) },
      ] as const

    const sharedLabelMatch = (
      query: string,
      tmdbId: number,
      strippedTitle: string,
    ): Metadata => ({
      query,
      year: undefined,
      createdAt: '2026-10-24T00:00:00.000Z',
      movieId: `tmdb:${tmdbId}`,
      title: strippedTitle,
      tmdb: { id: tmdbId, releaseDate: '2024-01-01' } as Metadata['tmdb'],
      match: {
        status: 'matched',
        method: 'shared-label',
        confidence: 1,
        strippedTitle,
      },
    })

    const run = (screenings: Screening[], metadata: Metadata[]) =>
      resolveScreenings(screenings, {
        metadata,
        metadataLookups: new Map(
          screenings.map((s) => lookup(s.title.toLowerCase(), s.title)),
        ),
      })

    test('is the label several titles share, once the title without it matched', () => {
      const resolved = run(
        [docs('Docs: Naza'), docs('Docs: Coward')],
        [
          sharedLabelMatch('docs: naza', 1, 'Naza'),
          sharedLabelMatch('docs: coward', 2, 'Coward'),
        ],
      )

      expect(resolved.screenings).toEqual([
        expect.objectContaining({
          title: 'Coward',
          event: 'Docs',
          movieId: 'tmdb:2',
        }),
        expect.objectContaining({
          title: 'Naza',
          event: 'Docs',
          movieId: 'tmdb:1',
        }),
      ])
      expect(resolved.review.detectedEvents).toEqual([
        {
          cinema: 'Rialto',
          event: 'Docs',
          status: 'applied',
          titles: ['Coward', 'Naza'],
          screenings: 2,
        },
      ])
    })

    test('keeps the event a scraper set itself, and takes a parenthesis as a note', () => {
      const resolved = run(
        [
          docs('Docs: Naza (Incl. Talk)', { event: 'Docs on Tour' }),
          docs('Docs: Coward (Incl. Talk)'),
        ],
        [
          sharedLabelMatch('docs: naza (incl. talk)', 1, 'Naza'),
          sharedLabelMatch('docs: coward (incl. talk)', 2, 'Coward'),
        ],
      )

      expect(resolved.screenings).toEqual([
        expect.objectContaining({
          title: 'Coward',
          event: 'Docs',
          notes: ['Incl. Talk'],
        }),
        expect.objectContaining({
          title: 'Naza',
          event: 'Docs on Tour',
          notes: ['Incl. Talk'],
        }),
      ])
      expect(resolved.review.detectedEvents).toEqual([
        {
          cinema: 'Rialto',
          event: 'Docs',
          status: 'applied',
          titles: ['Coward'],
          screenings: 1,
        },
      ])
    })

    test('is not found for a title that matched as it was, or did not match', () => {
      const resolved = run(
        [docs('Docs: Naza'), docs('Docs: Coward')],
        [
          {
            ...sharedLabelMatch('docs: naza', 1, 'Naza'),
            match: { status: 'matched', method: 'tmdb-search', confidence: 1 },
          },
          {
            query: 'docs: coward',
            year: undefined,
            createdAt: '',
            match: { status: 'unmatched', method: 'unmatched' },
          },
        ],
      )

      expect(
        resolved.screenings.map(({ title, event }) => [title, event]),
      ).toEqual([
        ['Docs: Coward', undefined],
        ['Docs: Naza', undefined],
      ])
      expect(resolved.review.detectedEvents).toEqual([])
    })

    test('is not a label that only names the programme of the cinema', () => {
      const resolved = run(
        [docs('Naza - Expat Cinema'), docs('Coward - Expat Cinema')],
        [
          sharedLabelMatch('naza - expat cinema', 1, 'Naza'),
          sharedLabelMatch('coward - expat cinema', 2, 'Coward'),
        ],
      )

      expect(resolved.screenings).toEqual([
        expect.objectContaining({ title: 'Coward', movieId: 'tmdb:2' }),
        expect.objectContaining({ title: 'Naza', movieId: 'tmdb:1' }),
      ])
      expect(resolved.screenings[0]).not.toHaveProperty('event')
      expect(resolved.review.detectedEvents).toEqual([])
    })

    describe('from the part of a title that matched', () => {
      const coldWar = (
        method: 'tmdb-search' | 'title-part',
        query: string,
        extra: Partial<Metadata> = {},
      ): Metadata => ({
        query,
        year: undefined,
        createdAt: '2026-10-24T00:00:00.000Z',
        movieId: 'tmdb:440298',
        title: 'Cold War',
        originalTitle: 'Zimna wojna',
        tmdb: {
          id: 440298,
          releaseDate: '2018-06-08',
          alternativeTitles: ['Cold War 2018'],
        } as Metadata['tmdb'],
        match: {
          status: 'matched',
          method,
          confidence: 1,
          ...(method === 'title-part' && { strippedTitle: 'Cold War' }),
        },
        ...extra,
      })

      const at = (cinema: string, title: string) =>
        docs(title, { cinema, url: `https://example.com/${cinema}/${title}` })

      test('is the rest of the title when the film is shown under just that part elsewhere', () => {
        const resolved = run(
          [
            at('Lab111', 'Cinema Aperitivo: Cold War'),
            at('Concordia', 'Cold War'),
          ],
          [
            coldWar('title-part', 'cinema aperitivo: cold war'),
            coldWar('tmdb-search', 'cold war'),
          ],
        )

        expect(
          resolved.screenings.map(({ cinema, title, event }) => [
            cinema,
            title,
            event,
          ]),
        ).toEqual([
          ['Concordia', 'Cold War', undefined],
          ['Lab111', 'Cold War', 'Cinema Aperitivo'],
        ])
        expect(resolved.review.detectedEvents).toEqual([
          {
            cinema: 'Lab111',
            event: 'Cinema Aperitivo',
            status: 'applied',
            titles: ['Cold War'],
            screenings: 1,
          },
        ])
      })

      test('is only a candidate to review when nothing else shows the film under that name', () => {
        const resolved = run(
          [at('Lab111', 'Cinema Aperitivo: Cold War')],
          [coldWar('title-part', 'cinema aperitivo: cold war')],
        )

        expect(resolved.screenings).toEqual([
          expect.objectContaining({ title: 'Cinema Aperitivo: Cold War' }),
        ])
        expect(resolved.screenings[0]).not.toHaveProperty('event')
        expect(resolved.review.detectedEvents).toEqual([
          expect.objectContaining({
            event: 'Cinema Aperitivo',
            status: 'candidate',
          }),
        ])
      })

      test('is not found when the rest is another name of the film', () => {
        const resolved = run(
          [at('Lab111', 'Cold War: Zimna wojna'), at('Concordia', 'Cold War')],
          [
            coldWar('title-part', 'cold war: zimna wojna'),
            coldWar('tmdb-search', 'cold war'),
          ],
        )

        expect(resolved.screenings.map(({ event }) => event)).toEqual([
          undefined,
          undefined,
        ])
        expect(resolved.review.detectedEvents).toEqual([])
      })

      test('is a note, not an event, when the rest says something about the screening', () => {
        const resolved = run(
          [
            at('Lab111', 'Cold War - 4K Restoration'),
            at('Concordia', 'Cold War'),
          ],
          [
            coldWar('title-part', 'cold war - 4k restoration'),
            coldWar('tmdb-search', 'cold war'),
          ],
        )

        expect(resolved.screenings).toEqual([
          expect.objectContaining({ cinema: 'Concordia', title: 'Cold War' }),
          expect.objectContaining({
            cinema: 'Lab111',
            title: 'Cold War',
            notes: ['4K Restoration'],
          }),
        ])
        expect(resolved.screenings[1]).not.toHaveProperty('event')
        expect(resolved.review.detectedEvents).toEqual([])
      })
    })
  })
})
