import { parseYear } from '../scrapers/eyefilm'

describe('parseYear', () => {
  test.each([
    ['1996', 1996],
    [1996, 1996],
    ['2026', 2026],
  ])('turns %p into the number %p', (year, expected) => {
    expect(parseYear(year)).toBe(expected)
  })

  test.each([[null], [undefined], [''], ['unknown'], ['1996-1997']])(
    'has no year for %p',
    (year) => {
      expect(parseYear(year)).toBeUndefined()
    },
  )
})
