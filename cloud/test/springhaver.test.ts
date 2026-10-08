import { extractYear } from '../scrapers/springhaver'

// Entries of https://springhaver.nl/fk-feed/agenda, as on 2026-10-07
describe('extractYear', () => {
  test('uses the year field of the feed', () => {
    expect(extractYear({ title: 'The Cycle Of Love', year: '2025' })).toBe(2025)
    expect(
      extractYear({
        title: 'The Texas Chain Saw Massacre (1974)',
        year: '1974',
      }),
    ).toBe(1974)
  })

  test('falls back to the year in the title when the field is empty', () => {
    expect(extractYear({ title: 'Akira (1988)', year: '' })).toBe(1988)
    expect(extractYear({ title: 'Scream (1996)', year: '' })).toBe(1996)
    expect(extractYear({ title: 'Good Bye, Lenin! (2003)', year: '' })).toBe(
      2003,
    )
  })

  test('prefers the field over the title', () => {
    expect(extractYear({ title: 'Akira (1988)', year: '1989' })).toBe(1989)
  })

  test('has no year when neither says it', () => {
    expect(extractYear({ title: 'Yellow Letters', year: '' })).toBeUndefined()
    expect(extractYear({ title: 'Naza', year: '' })).toBeUndefined()
  })

  test('ignores an age rating or an edition in the title', () => {
    expect(extractYear({ title: 'Matilda (6+)', year: '' })).toBeUndefined()
    expect(
      extractYear({ title: 'Freeride Film Festival 2026', year: '' }),
    ).toBeUndefined()
    expect(
      extractYear({ title: 'Stitch Head (OV &#8211; 8+)', year: '' }),
    ).toBeUndefined()
  })
})
