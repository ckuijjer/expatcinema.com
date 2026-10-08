import { parseYearOfProduction } from '../scrapers/hetdocumentairepaviljoen'

describe('parseYearOfProduction', () => {
  // film detail of https://www.idfa.nl/en/cinema/29a64f65-dc3f-4238-8528-7d083f7ac3de
  // { "fullPreferredTitle": "Sans soleil", "yearOfProduction": 1982, "edition": { "name": "Het Documentaire Paviljoen", "year": 2023 } }
  test('takes the production year of the film', () => {
    expect(parseYearOfProduction(1982)).toBe(1982) // Sans soleil
    expect(parseYearOfProduction(2010)).toBe(2010) // Into Eternity
    expect(parseYearOfProduction(2026)).toBe(2026) // Naza
  })

  test('ignores a missing or unusable year', () => {
    expect(parseYearOfProduction(undefined)).toBeUndefined()
    expect(parseYearOfProduction(null)).toBeUndefined()
    expect(parseYearOfProduction(0)).toBeUndefined()
    expect(parseYearOfProduction(1066)).toBeUndefined()
    expect(parseYearOfProduction(3000)).toBeUndefined()
    expect(parseYearOfProduction('1982-1990')).toBeUndefined()
  })
})
