import {
  cleanTitle,
  extractYear,
  hasEnglishSubtitles,
  parseHeading,
} from '../scrapers/filmhuisemmen'

// Strings as on https://www.filmhuisemmen.nl/programma/ (2026-10-03)
describe('filmhuisemmen', () => {
  describe('parseHeading', () => {
    test('reads title, date and start time, in Amsterdam time', () => {
      expect(
        parseHeading(
          'The Invite<br>Dinsdag 13 oktober 2026<br>Aanvang: 19:15 uur',
        ),
      ).toEqual({
        title: 'The Invite',
        date: new Date('2026-10-13T17:15:00Z'), // CEST
      })
    })

    test('uses winter time after the clocks change', () => {
      // summer time ends on Sunday 25 October 2026
      expect(
        parseHeading(
          "Des preuves d'amour<br>Maandag 26 oktober 2026<br>Aanvang: 20:00 uur",
        ),
      ).toEqual({
        title: "Des preuves d'amour",
        date: new Date('2026-10-26T19:00:00Z'), // CET
      })
    })

    test('reads the year from the date, so a season spanning New Year works', () => {
      expect(
        parseHeading('Jimpa<br>Maandag 4 januari 2027<br>Aanvang: 20:00 uur'),
      ).toEqual({
        title: 'Jimpa',
        date: new Date('2027-01-04T19:00:00Z'),
      })
    })

    test.each([
      ['no date', 'Fuori<br>Aanvang: 19:15 uur'],
      ['no time', 'Fuori<br>Dinsdag 6 oktober 2026'],
      ['no title', '<br>Dinsdag 6 oktober 2026<br>Aanvang: 19:15 uur'],
      [
        'an impossible date',
        'Fuori<br>Dinsdag 31 november 2026<br>Aanvang: 19:15 uur',
      ],
      ['nothing', ''],
    ])('returns undefined for %s', (_, heading) => {
      expect(parseHeading(heading)).toBeUndefined()
    })
  })

  describe('extractYear', () => {
    test('takes the year from the end of the country line', () => {
      expect(
        extractYear([
          'Land: Australië, Nederland, Finland, 2024',
          'Genre: drama',
          'Speelduur: 114 min.',
        ]),
      ).toBe(2024)
      expect(extractYear(['Land: VS, 2026'])).toBe(2026)
    })

    test('is undefined without a year, and does not guess one from other lines', () => {
      expect(extractYear(['Land: Frankrijk'])).toBeUndefined()
      expect(
        extractYear(['Genre: drama', 'Speelduur: 128 min.']),
      ).toBeUndefined()
      expect(extractYear(['Met: Olivia Wilde, 2024'])).toBeUndefined()
      expect(extractYear([])).toBeUndefined()
    })
  })

  describe('hasEnglishSubtitles', () => {
    test('finds the note in the description of a film page', () => {
      // I Never Cry (2021-22), the example in issue #315
      expect(
        hasEnglishSubtitles(
          'LET OP: ENGELS ONDERTITELD Omdat er een exodus is van Poolse arbeidskrachten naar andere EU-landen, worden hun kinderen inmiddels Euro-wezen genoemd.',
        ),
      ).toBe(true)
      expect(hasEnglishSubtitles('Een film. Let op: Engels ondertiteld')).toBe(
        true,
      )
    })

    test.each([
      // The Invite, as on the programme
      'Een pikant voorstel leidt tot een venijnige ruzie tussen twee stellen, waarin wijze woorden vallen over relaties.',
      'Engelstalige film met Nederlandse ondertiteling',
      '',
    ])('is false for %p', (description) => {
      expect(hasEnglishSubtitles(description)).toBe(false)
    })
  })

  describe('cleanTitle', () => {
    test.each([
      ['The Invite', 'The Invite'],
      ['  Fuori ', 'Fuori'],
      ['De Gaulle: Résistance', 'De Gaulle: Résistance'],
      ['I NEVER CRY', 'I Never Cry'],
    ])('%p -> %p', (input, expected) => {
      expect(cleanTitle(input)).toBe(expected)
    })
  })
})
