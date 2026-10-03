import {
  cleanTitle,
  extractDate,
  extractScreeningsFromFeed,
} from '../scrapers/filmkoepel'

// Shaped like https://filmkoepel.nl/fk-feed/agenda (2026-10-02)
const FEED = {
  '195704': {
    title: 'Digger',
    year: '',
    language: { label: 'Ondertitels', value: 'Nederlands' },
    permalink: 'https://filmkoepel.nl/films/digger/',
    times: [
      { program_start: '202610021630', program_end: '202610021854', tags: [] },
      { program_start: '202610022115', program_end: '202610022339', tags: [] },
    ],
  },
  '200001': {
    title: 'a film with english subtitles',
    year: '2024',
    language: { label: 'Ondertitels', value: 'Engels' },
    permalink: 'https://filmkoepel.nl/films/english-subtitles/',
    times: [
      { program_start: '202610031400', program_end: '202610031600', tags: [] },
      // tagged as having no subtitles, even though the film label says English
      {
        program_start: '202610031830',
        program_end: '202610032030',
        tags: ['No subs'],
      },
    ],
  },
  '200002': {
    title: 'Tagged Film',
    year: '',
    language: '' as const,
    permalink: 'https://filmkoepel.nl/films/tagged/',
    times: [
      {
        program_start: '202610110000', // midnight
        program_end: '202610110130',
        tags: ['EN SUBS'],
      },
      { program_start: '202610121100', program_end: '202610121300', tags: [] },
    ],
  },
  // a film without showtimes
  '200003': {
    title: 'Coming Soon',
    permalink: 'https://filmkoepel.nl/films/coming-soon/',
  },
}

describe('filmkoepel', () => {
  describe('extractDate', () => {
    test('reads the showtime as Amsterdam time', () => {
      // summer time
      expect(extractDate('202610021630')).toEqual(
        new Date('2026-10-02T14:30:00Z'),
      )
      // winter time, after the clocks go back on 25 October
      expect(extractDate('202611011100')).toEqual(
        new Date('2026-11-01T10:00:00Z'),
      )
    })
  })

  test('cleanTitle', () => {
    expect(cleanTitle(' a film with english subtitles ')).toBe(
      'A Film with English Subtitles',
    )
  })

  describe('extractScreeningsFromFeed', () => {
    test('keeps the screenings with English subtitles', () => {
      expect(extractScreeningsFromFeed(FEED)).toEqual([
        {
          title: 'A Film with English Subtitles',
          year: 2024,
          url: 'https://filmkoepel.nl/films/english-subtitles/',
          cinema: 'Filmkoepel',
          date: new Date('2026-10-03T12:00:00Z'),
        },
        {
          title: 'Tagged Film',
          year: undefined,
          url: 'https://filmkoepel.nl/films/tagged/',
          cinema: 'Filmkoepel',
          date: new Date('2026-10-10T22:00:00Z'),
        },
      ])
    })

    test('skips Dutch subtitles and films without showtimes', () => {
      const titles = extractScreeningsFromFeed(FEED).map(({ title }) => title)

      expect(titles).not.toContain('Digger')
      expect(titles).not.toContain('Coming Soon')
    })

    test('accepts the feed as a list, and an empty feed', () => {
      expect(extractScreeningsFromFeed(Object.values(FEED))).toHaveLength(2)
      expect(extractScreeningsFromFeed({})).toEqual([])
      expect(extractScreeningsFromFeed([])).toEqual([])
    })
  })
})
