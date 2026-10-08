import { extractYear } from '../scrapers/slachtstraat'

// Titles and year fields from https://slachtstraat.nl/fk-feed/agenda (2026-10-07)
describe('slachtstraat extractYear', () => {
  test.each([
    ['Good Bye, Lenin! (2003)', '', 2003],
    ['Der Held Von Bahnhof Friedrichstrasse (2025)', '', 2025],
    ['3×3 Eyes (1991)', '1991', 1991],
    ['Children Who Chase Lost Voices (2011)', '2011', 2011],
  ])('%s with year field %p is %p', (title, year, expected) => {
    expect(extractYear(title, year)).toBe(expected)
  })

  test('prefers the year field over the title', () => {
    expect(extractYear('Close (2022)', '2023')).toBe(2023)
  })

  test.each([
    ['Etwas Ganz Besonderes', ''],
    ["Andiamo a Bere L'ultima", ''],
    ['NT Live 2026 – The Misanthrope', undefined],
    ['Freeride Film Festival 2026', ''],
  ])('has no year for %s', (title, year) => {
    expect(extractYear(title, year)).toBeUndefined()
  })
})
