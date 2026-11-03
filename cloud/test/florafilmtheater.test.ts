import {
  extractReleaseYear,
  hasEnglishSubtitles,
  splitDateAndTimes,
} from '../scrapers/florafilmtheater'

describe('florafilmtheater', () => {
  describe('splitDateAndTimes', () => {
    test.each([
      ['Vandaag 21:30', 'Vandaag', ['21:30']],
      ['di 13 okt. 20:00', 'di 13 okt.', ['20:00']],
      // a film that is shown twice on one day
      ['za 24 okt. 15:00 21:15', 'za 24 okt.', ['15:00', '21:15']],
      ['Morgen 12:40 16:20', 'Morgen', ['12:40', '16:20']],
      ['vr 09 okt.', 'vr 09 okt.', []],
      // sold out
      ['Morgen 19:25 Uitverkocht', 'Morgen', ['19:25']],
      ['ma 05 okt. 19:20 Uitverkocht', 'ma 05 okt.', ['19:20']],
      ['za 24 okt. 15:00 Uitverkocht 21:15', 'za 24 okt.', ['15:00', '21:15']],
    ])('%p', (input, date, times) => {
      expect(splitDateAndTimes(input)).toEqual({ date, times })
    })
  })

  describe('extractReleaseYear', () => {
    test.each([
      // Flora's own metadata year is the listing year (2026), not the
      // release year; the title's parenthetical year is correct here.
      [
        {
          rawTitle: 'Trois couleurs: Blanc (1994) - EN subs',
          metadata: ['English SUBS', 'Frans gesproken', '90 min', '2026'],
        },
        1994,
      ],
      [
        {
          rawTitle: 'Trois couleurs: Bleu (1993) - EN subs',
          metadata: ['EN SUBS', 'Frans gesproken', '90 min', '2026'],
        },
        1993,
      ],
      // metadata year agrees with the title year
      [
        {
          rawTitle: 'Trois couleurs: Rouge (1994) - EN subs',
          metadata: ['English SUBS', 'French gesproken', '99 min', '1994'],
        },
        1994,
      ],
      // no year in the title, fall back to the metadata year
      [
        {
          rawTitle: 'Naza - EN subs',
          metadata: ['EN SUBS', 'Hebreeuws gesproken', '80 min', '2026'],
        },
        2026,
      ],
    ])('%p -> %p', (movie, expected) => {
      expect(extractReleaseYear(movie)).toBe(expected)
    })
  })

  describe('hasEnglishSubtitles', () => {
    test.each([
      [['EN SUBS', 'Ana Lily Amirpour', '90 min'], true],
      [['English SUBS', 'Persian gesproken', '2014'], true],
      [['NL SUBS', 'Someone'], false],
      [['Nederlands gesproken', 'Someone'], false],
      [[], false],
    ])('%p', (metadata, expected) => {
      expect(hasEnglishSubtitles({ metadata })).toBe(expected)
    })
  })
})
