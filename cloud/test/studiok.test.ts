import { extractYear } from '../scrapers/studiok'

// The details of https://studio-k.nu/film/faust-1994-strings-of-imagination/, as on 2026-10-07
const FAUST_META =
  'Regie: Jan SvankmajerCast: Petr Čepek, Jan Kraus, Vladimír KudlaSpeelduur: 107 minTaal: TsjechischOndertiteling: Engels Jaar: 1994Kijkwijzer:'

// https://studio-k.nu/film/palestine-36-eng-subs/
const PALESTINE_META =
  'Regie: Annemarie JacirGenre: DramaSpeelduur: 118 minTaal: ArabischOndertiteling: Engels Jaar: 2025Kijkwijzer:'

// https://studio-k.nu/film/naza-eng-subs/ has no "Jaar"
const NAZA_META =
  'Regie: Yuval Abraham, Rachel SzorSpeelduur: 80 minKijkwijzer:'

describe('extractYear', () => {
  test('reads the year from "Jaar"', () => {
    expect(extractYear(FAUST_META)).toBe(1994)
    expect(extractYear(PALESTINE_META)).toBe(2025)
  })

  test('prefers "Jaar" over the year in the title', () => {
    expect(
      extractYear(FAUST_META, 'Faust (1994) • Strings of Imagination'),
    ).toBe(1994)
  })

  test('falls back to the year in the title', () => {
    expect(extractYear(NAZA_META, 'Alice (1988)')).toBe(1988)
  })

  test('has no year without "Jaar"', () => {
    expect(extractYear(NAZA_META, 'NAZA (ENG SUBS)')).toBeUndefined()
    expect(extractYear(undefined)).toBeUndefined()
  })

  test('ignores a year that can not be the year of a film', () => {
    expect(extractYear('Jaar: 2099Kijkwijzer:')).toBeUndefined()
    expect(extractYear('Jaar: 1500Kijkwijzer:')).toBeUndefined()
  })
})
