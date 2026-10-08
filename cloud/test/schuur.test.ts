import { extractYear } from '../scrapers/schuur'

// The details of https://www.schuur.nl/film/coward-en, as on 2026-10-08
const COWARD_DETAILS = `
  <ul class="space-y-1 text-sm sm:text-base lg:text-md leading-snug">
    <li>
      <strong>Land</strong>
      <span>Belgium, France, The Netherlands</span>
    </li>
    <li>
      <strong>Jaar</strong>
      <span>2026</span>
    </li>
    <li>
      <strong>Duur</strong>
      <span>127 min</span>
    </li>
  </ul>`

// https://www.schuur.nl/film/shall-we-dance
const SHALL_WE_DANCE_DETAILS = `
  <li><strong>Jaar</strong> <span>1996</span></li>
  <li><strong>Duur</strong> <span>136 min</span></li>`

describe('extractYear', () => {
  test('reads the "Jaar" of the film details', () => {
    expect(extractYear(COWARD_DETAILS)).toBe(2026)
    expect(extractYear(SHALL_WE_DANCE_DETAILS)).toBe(1996)
  })

  test('has no year when the page has no "Jaar"', () => {
    expect(
      extractYear(
        '<li><strong>Land</strong><span>Belgium</span></li><li><strong>Duur</strong><span>127 min</span></li>',
      ),
    ).toBeUndefined()
  })

  test('ignores a "Jaar" that is not a single film year', () => {
    expect(
      extractYear('<li><strong>Jaar</strong><span>2024-2026</span></li>'),
    ).toBeUndefined()
    expect(
      extractYear('<li><strong>Jaar</strong><span>0000</span></li>'),
    ).toBeUndefined()
    expect(
      extractYear('<li><strong>Jaar</strong><span>2099</span></li>'),
    ).toBeUndefined()
  })

  test('ignores a year elsewhere on the page', () => {
    expect(
      extractYear('<time>zo 11 oktober 2026</time><strong>Duur</strong>'),
    ).toBeUndefined()
  })
})
