import {
  cleanTitle,
  hasEnglishSubtitles,
  parseProductionId,
  parseReleaseYear,
  parseScreeningDate,
} from '../scrapers/fchyena'

describe('fchyena', () => {
  describe('parseProductionId', () => {
    test.each([
      [
        'https://tickets.fchyena.nl/fchyena/nl/flow_configs/1/z_events_list?production_id=123488',
        '123488',
      ],
      ['https://tickets.fchyena.nl/x?a=1&production_id=92358&b=2', '92358'],
    ])('%p', (href, expected) => {
      expect(parseProductionId(href)).toBe(expected)
    })

    test.each([
      'https://tickets.fchyena.nl/x?production_id=0',
      'https://tickets.fchyena.nl/x?production_id=',
      'https://tickets.fchyena.nl/x',
      '',
    ])('%p has none', (href) => {
      expect(parseProductionId(href)).toBeUndefined()
    })
  })

  describe('hasEnglishSubtitles', () => {
    // Language and title values as seen on fchyena.nl on 2026-10-02
    test.each([
      'Hebrew, with English subs',
      'NAZA - ENG SUBS',
      'Hebrew Hebreeuws gesproken, Engels ondertiteld',
      'Engels gesproken, Engels ondertiteld',
      'French, English subtitles',
    ])('accepts %p', (value) => {
      expect(hasEnglishSubtitles(value)).toBe(true)
    })

    test.each([
      'Hebreeuws gesproken, Nederlands ondertiteld',
      'Engels gesproken, Nederlands ondertiteld',
      'Engels gesproken, geen ondertiteling',
      'Spaans, Engels gesproken, Nederlands ondertiteld',
      'Engels, Nederlands ondertiteld',
      'Spaans, Engels, Frans', // spoken languages, no subtitles mentioned
      'Engels',
      'NL',
      'NAZA - NL subs',
      '',
      undefined,
    ])('rejects %p', (value) => {
      expect(hasEnglishSubtitles(value)).toBe(false)
    })
  })

  describe('cleanTitle', () => {
    test.each([
      ['NAZA - ENG SUBS', 'Naza'],
      ['NAZA - NL subs', 'Naza'],
      ['Some Film - English subs', 'Some Film'],
      ['The Forgotten Island ', 'The Forgotten Island'],
      [
        'PAFF Sneak Preview x Amongst Friends',
        'Paff Sneak Preview X Amongst Friends',
      ],
      ['Leviticus (2025)', 'Leviticus'],
    ])('%p -> %p', (input, expected) => {
      expect(cleanTitle(input)).toBe(expected)
    })
  })

  describe('parseReleaseYear', () => {
    test.each([
      ['2026', 2026],
      [' 1981 ', 1981],
      ['Year', undefined],
      ['', undefined],
      ['12345', undefined],
      [undefined, undefined],
    ])('%p -> %p', (input, expected) => {
      expect(parseReleaseYear(input)).toBe(expected)
    })
  })

  describe('parseScreeningDate', () => {
    test('parses the date of the ticket shop in Amsterdam time', () => {
      expect(parseScreeningDate('za 03 oktober 2026, 19:00')).toEqual(
        new Date('2026-10-03T17:00:00Z'), // CEST
      )
    })

    test('uses winter time after the clocks change', () => {
      expect(parseScreeningDate('zo 01 november 2026, 15:45')).toEqual(
        new Date('2026-11-01T14:45:00Z'), // CET
      )
    })

    test('throws on something that is not a date', () => {
      expect(() => parseScreeningDate('Bestellen')).toThrow(
        'Could not parse FC Hyena screening date',
      )
    })
  })
})
