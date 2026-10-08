import { parseYear } from '../scrapers/forumgroningen'

// The credits of https://forum.nl/en/whats-on/film/classics-akira, as on 2026-10-07:
// <p class="title">Country</p><p class="content">Japan</p>
// <p class="title">Year</p><p class="content">1988</p>
// <p class="title">Language</p><p class="content">Japanese spoken, Dutch subtitles</p>
const AKIRA_CREDITS = [
  { label: 'Country', value: 'Japan' },
  { label: 'Year', value: '1988' },
  { label: 'Language', value: 'Japanese spoken, Dutch subtitles' },
  { label: 'Cast', value: 'Mitsuo Iwata, Nozomu Sasaki, Mami Koyama' },
  { label: 'Director', value: 'Katsuhiro Otomo' },
  { label: 'Duration', value: '124 min' },
]

describe('parseYear', () => {
  test('reads the Year of the credits', () => {
    expect(parseYear(AKIRA_CREDITS)).toBe(1988)
  })

  test('reads the year of a new film', () => {
    expect(parseYear([{ label: 'Year', value: '2026' }])).toBe(2026)
  })

  test('has no year without a Year row', () => {
    expect(
      parseYear(AKIRA_CREDITS.filter(({ label }) => label !== 'Year')),
    ).toBeUndefined()
  })

  test('has no year for a page without credits', () => {
    expect(parseYear([])).toBeUndefined()
  })

  test.each([
    ['empty', ''],
    ['a range', '1988-1990'],
    ['text', 'Unknown'],
    ['a duration', '124 min'],
    ['too old', '1700'],
    ['too far in the future', '2100'],
  ])('has no year for %s', (_name, value) => {
    expect(parseYear([{ label: 'Year', value }])).toBeUndefined()
  })

  test('ignores the year in other rows', () => {
    expect(parseYear([{ label: 'Duration', value: '2025' }])).toBeUndefined()
  })
})
