import { parseOriginYear } from '../scrapers/concordia'

describe('parseOriginYear', () => {
  test.each([
    // https://www.concordia.nl/nl/agenda/shall-we-dance-30th-anniversary
    ['Japan, 1996', 1996],
    // https://www.concordia.nl/nl/agenda/fjord
    ['Roemenië,Frankrijk,Noorwegen,Finland,Denemarken,Zweden, 2026', 2026],
    // https://www.concordia.nl/nl/agenda/naza
    [' Verenigd Koninkrijk, 2026 ', 2026],
  ])('takes the year of "%s"', (origin, year) => {
    expect(parseOriginYear(origin)).toBe(year)
  })

  test.each([
    // https://www.concordia.nl/nl/agenda/kreator-hate-and-hope has no "Herkomst"
    [undefined],
    [''],
    ['Japan'],
    ['Japan, 3996'],
    ['Japan, 1500'],
    ['Japan, 20267'],
  ])('has no year for "%s"', (origin) => {
    expect(parseOriginYear(origin)).toBeUndefined()
  })
})
