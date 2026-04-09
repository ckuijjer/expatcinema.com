import { extractYearFromTitle } from '../scrapers/utils/extractYearFromTitle'

describe('extractYearFromTitle', () => {
  test('extracts a trailing parenthetical year', () => {
    expect(extractYearFromTitle('The Piano Teacher (2001)')).toBe(2001)
  })

  test('extracts a year from a mixed parenthetical label', () => {
    expect(extractYearFromTitle('Funny Games (1997, ENG subs)')).toBe(1997)
  })

  test('extracts the last parenthetical year when multiple labels exist', () => {
    expect(extractYearFromTitle('Caché (2005) (En Subs)')).toBe(2005)
  })

  test('does not treat non-parenthetical title numbers as a release year', () => {
    expect(extractYearFromTitle('1900 (Novecento) – Part One')).toBeUndefined()
  })
})
