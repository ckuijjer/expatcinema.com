import { parseYear } from '../scrapers/natlab'

// The details of https://www.natlab.nl/nl/programma/train-to-busan-k-wave-d8dv, as on 2026-10-07:
// <dt>Regie</dt><dd>Yeon Sang-ho</dd> <dt>Speelduur</dt><dd>118 min</dd>
// <dt>Jaar</dt><dd>2016</dd> <dt>Land</dt><dd>Zuid-Korea</dd> <dt>Ondertiteling</dt><dd>Engels</dd>
const TRAIN_TO_BUSAN = {
  Regie: 'Yeon Sang-ho',
  Speelduur: '118 min',
  Jaar: '2016',
  Land: 'Zuid-Korea',
  Ondertiteling: 'Engels',
}

// https://www.natlab.nl/nl/programma/children-who-chase-lost-voices-6r42 has "Jaar" 2011
const CHILDREN = { Regie: 'Makoto Shinkai', Speelduur: '116 min', Jaar: '2011' }

describe('parseYear', () => {
  test('reads the "Jaar"', () => {
    expect(parseYear(TRAIN_TO_BUSAN)).toBe(2016)
    expect(parseYear(CHILDREN)).toBe(2011)
  })

  test('has no year without "Jaar"', () => {
    expect(
      parseYear({ Regie: 'Yeon Sang-ho', Speelduur: '118 min' }),
    ).toBeUndefined()
  })

  test('has no year for an empty list', () => {
    expect(parseYear({})).toBeUndefined()
  })

  test.each([
    ['empty', ''],
    ['a range', '2016-2018'],
    ['text', 'onbekend'],
    ['too old', '1700'],
    ['too far in the future', '2100'],
  ])('has no year for %s', (_name, Jaar) => {
    expect(parseYear({ Jaar })).toBeUndefined()
  })

  test('ignores a year in other details', () => {
    expect(parseYear({ Speelduur: '2016' })).toBeUndefined()
  })
})
