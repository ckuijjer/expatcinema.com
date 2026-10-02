import {
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
})
