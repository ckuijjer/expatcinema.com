import { extractYear } from '../scrapers/cinemathepulse'

// The `.heading-style-film-year` elements of a film page, as on 2026-10-08
describe('extractYear', () => {
  test('joins the parts "(", "1988", ")" of Akira', () => {
    expect(extractYear(['(', '1988', ')'])).toBe(1988)
  })

  test('reads the year of a classic and of a new film', () => {
    // Les Parapluies de Cherbourg, and a new film such as Coward
    expect(extractYear(['(', '1964', ')'])).toBe(1964)
    expect(extractYear(['(', '2026', ')'])).toBe(2026)
  })

  test('has no year when the page has no year elements', () => {
    expect(extractYear([])).toBeUndefined()
    expect(extractYear(undefined)).toBeUndefined()
    expect(extractYear(['(', ')'])).toBeUndefined()
  })

  test('ignores values that are not a film year', () => {
    expect(extractYear(['(', '0000', ')'])).toBeUndefined()
    expect(extractYear(['(', '2099', ')'])).toBeUndefined()
    expect(extractYear(['(', '1988-2026', ')'])).toBeUndefined()
    expect(extractYear(['TBA'])).toBeUndefined()
  })
})
