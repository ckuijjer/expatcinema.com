import {
  cleanTitle,
  extractScreeningsFromResults,
  hasEnglishSubtitles,
  parseDate,
} from '../scrapers/chasse'

describe('chasse', () => {
  describe('parseDate', () => {
    test.each([
      ['vr 9 okt 2026', '17.15 - 19.10', '2026-10-09T15:15:00Z'], // CEST
      ['wo 25 nov 2026', '19.00 - 21.00', '2026-11-25T18:00:00Z'], // CET
      ['zo 28 mrt 2027', '16.30', '2027-03-28T14:30:00Z'], // after the clocks change
      ['zo 31 jan 2027', '16:30', '2027-01-31T15:30:00Z'],
    ])('%p %p', (date, time, expected) => {
      expect(parseDate(date, time)).toEqual(new Date(expected))
    })

    test('throws on a date it cannot read', () => {
      expect(() => parseDate('binnenkort', '')).toThrow(
        'Could not parse Chasse screening date',
      )
    })
  })

  describe('hasEnglishSubtitles', () => {
    test.each([
      ['A Fantastic Woman (EN subs) | Be Proud Weekend', true],
      ['Internationals Cinema (EN subs)', true],
      ['Youri (en subs)', true],
      ['BUas Movie Club Selection', false],
      ['Zomerfeest met Engelse subs', false],
    ])('%p', (title, expected) => {
      expect(hasEnglishSubtitles(title)).toBe(expected)
    })
  })

  describe('cleanTitle', () => {
    test.each([
      ['A Fantastic Woman (EN subs) | Be Proud Weekend', 'A Fantastic Woman'],
      ['Franz (EN subs) - Internationals Cinema Breda', 'Franz'],
      ['Youri (EN subs)', 'Youri'],
      ['Internationals Cinema Breda: Franz (EN subs)', 'Franz'],
      // placeholders for a film that isn't announced yet
      ['Internationals Cinema (EN subs)', ''],
      ['Internationals Cinema Breda (EN subs)', ''],
    ])('%p -> %p', (title, expected) => {
      expect(cleanTitle(title)).toBe(expected)
    })
  })

  describe('extractScreeningsFromResults', () => {
    const card = (title: string, path: string, date: string, time: string) => ({
      title,
      url: path,
      date,
      time,
    })

    test('keeps films with English subtitles, drops the rest and the placeholders', () => {
      const screenings = extractScreeningsFromResults([
        card(
          'Franz (EN subs) - Internationals Cinema Breda',
          '/programma/franz-en-subs-internationals-cinema-breda-rvlw',
          'zo 25 okt 2026',
          '16.30 - 18.45',
        ),
        card(
          'BUas Movie Club Selection',
          '/programma/buas-movie-club-selection-nzq1',
          'wo 25 nov 2026',
          '19.00 - 21.00',
        ),
        card(
          'Internationals Cinema (EN subs)',
          '/programma/internationals-cinema-en-subs-l5wf',
          'zo 29 nov 2026',
          '16.30',
        ),
      ])

      expect(screenings).toEqual([
        {
          title: 'Franz',
          url: 'https://www.chasse.nl/programma/franz-en-subs-internationals-cinema-breda-rvlw',
          cinema: 'Chassé Cinema',
          date: new Date('2026-10-25T15:30:00Z'),
        },
      ])
    })

    test('returns nothing for an empty page', () => {
      expect(extractScreeningsFromResults([])).toEqual([])
    })
  })
})
