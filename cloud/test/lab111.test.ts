import { extractReleaseYear, parseReleaseYear } from '../scrapers/lab111'

// The details of https://www.lab111.nl/movie/akira/, as on 2026-10-07
const AKIRA_META = `
  <div class="meta col-xs-12 col-sm-12 col-md-3 xxx">
    <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Regisseur</h4><ul class="regisseur"><li>Katsuhiro Ôtomo</li></ul></div></div>
    <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Acteurs</h4><ul class="acteurs"><li>Mitsuo Iwata</li><li>Nozomu Sasaki</li></ul></div></div>
    <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Release</h4><ul class="release"><li>1 January 1988</li></ul></div></div>
    <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Speelduur</h4><ul class="speelduur"><li>2 uur en 4 minuten</li></ul></div></div>
  </div>`

// https://www.lab111.nl/movie/imagine-film-festival-macario/ has "Jaar" and no "Release"
const MACARIO_META = `
  <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Regisseur</h4><ul class="regisseur"><li>Roberto Gavaldón</li></ul></div></div>
  <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Jaar</h4><ul class="jaar"><li>1960</li></ul></div></div>
  <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Verwacht</h4><ul class="verwacht"><li>Ja</li></ul></div></div>`

// https://www.lab111.nl/movie/imagine-film-festival-cure/: the festival date, Cure is from 1997
const CURE_META = `
  <div class="zmovie-meta"><div class="col-xs-6 col-sm-4 col-md-12" ><h4>Release</h4><ul class="release"><li>29 October ${new Date().getFullYear()}</li></ul></div></div>`

describe('extractReleaseYear', () => {
  test('reads the year from "Release" as "1 January <year>"', async () => {
    await expect(extractReleaseYear(AKIRA_META)).resolves.toBe(1988)
  })

  test('reads the year from "Jaar"', async () => {
    await expect(extractReleaseYear(MACARIO_META)).resolves.toBe(1960)
  })

  test('has no year for the date of a festival', async () => {
    await expect(extractReleaseYear(CURE_META)).resolves.toBeUndefined()
  })

  test('has no year for a page without details', async () => {
    await expect(
      extractReleaseYear('<html><body><h1>Akira</h1></body></html>'),
    ).resolves.toBeUndefined()
  })
})

describe('parseReleaseYear', () => {
  const meta = (label: string, value: string) => [{ label, value }]

  const thisYear = new Date().getFullYear()

  test.each([
    ['Release', '1 January 1988', 1988],
    // a date in a past year: the release of the film
    ['Release', '18 November 1995', 1995],
    ['Release', '14 December 2023', 2023],
    ['Release', `1 January ${thisYear}`, thisYear],
    ['Jaar', '1964', 1964],
    ['Jaar', ' 2019 ', 2019],
  ])('takes the year of %s "%s"', (label, value, year) => {
    expect(parseReleaseYear(meta(label, value))).toBe(year)
  })

  test.each([
    // the date of a festival or an event, in the current year
    ['Release', `29 October ${thisYear}`],
    ['Release', `8 October ${thisYear}`],
    // not a year
    ['Jaar', 'onbekend'],
    ['Jaar', '1964-1965'],
    ['Jaar', ''],
    ['Release', ''],
    // not a possible year of a film
    ['Jaar', '1700'],
    ['Jaar', '3000'],
    ['Release', '1 January 1700'],
    // another detail
    ['Speelduur', '2 uur en 4 minuten'],
  ])('has no year for %s "%s"', (label, value) => {
    expect(parseReleaseYear(meta(label, value))).toBeUndefined()
  })

  test('prefers "Jaar" over "Release"', () => {
    expect(
      parseReleaseYear([
        { label: 'Release', value: '1 January 1988' },
        { label: 'Jaar', value: '1987' },
      ]),
    ).toBe(1987)
  })

  test('has no year without details', () => {
    expect(parseReleaseYear([])).toBeUndefined()
  })
})
