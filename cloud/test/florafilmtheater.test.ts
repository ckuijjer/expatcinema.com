import {
  extractMetadataYear,
  hasEnglishSubtitles,
  splitDateAndTimes,
} from '../scrapers/florafilmtheater'
import { extractYearFromTitle } from '../scrapers/utils/extractYearFromTitle'

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

  describe('extractMetadataYear', () => {
    test.each([
      [
        [
          'English SUBS',
          'Frans gesproken',
          'Krzysztof Kieślowski',
          '90 min',
          '2026',
        ],
        2026,
      ],
      [['NL SUBS', 'Someone'], undefined],
      [[], undefined],
    ])('%p', (metadata, expected) => {
      expect(extractMetadataYear(metadata)).toBe(expected)
    })
  })

  // Flora's own metadata year is the listing year, not always the film's
  // year: 'Trois couleurs: Blanc (1994) - EN subs' has metadata year '2026'
  describe('year: title year wins over the metadata year', () => {
    test.each([
      [
        'Trois couleurs: Blanc (1994) - EN subs',
        [
          'English SUBS',
          'Frans gesproken',
          'Krzysztof Kieślowski',
          '90 min',
          '2026',
        ],
        1994,
      ],
      [
        'Trois couleurs: Bleu (1993) - EN subs',
        [
          'EN SUBS',
          'Frans, Roemeens, Pools gesproken',
          'Krzysztof Kieślowski',
          '90 min',
          '2026',
        ],
        1993,
      ],
      // without a year in the title, the metadata year is still used
      [
        'Marie Antoinette (2006)',
        ['NL SUBS', 'Engels gesproken', 'Sofia Coppola', '123 min', '2006'],
        2006,
      ],
    ])('%p', (rawTitle, metadata, expected) => {
      expect(
        extractYearFromTitle(rawTitle) ?? extractMetadataYear(metadata),
      ).toBe(expected)
    })
  })
})
