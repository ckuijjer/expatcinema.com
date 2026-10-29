import { normalizeMovieTitleForLookup } from '../metadata/titleResolver'
import { removeDiacritics } from '../scrapers/utils/removeDiacritics'

describe('removeDiacritics', () => {
  it('removes the accents that Unicode can decompose', () => {
    expect(removeDiacritics('Céline Sciamma')).toBe('Celine Sciamma')
  })

  it('writes the letters without a diacritic as ASCII letters', () => {
    expect(removeDiacritics('Paweł Pawlikowski')).toBe('Pawel Pawlikowski')
    expect(removeDiacritics('Skovsbøl Srđan')).toBe('Skovsbol Srdan')
    expect(removeDiacritics('Cœur secret')).toBe('Coeur secret')
    expect(removeDiacritics('Boşluğa xütbə')).toBe('Bosluga xutbe')
    expect(removeDiacritics('Straße Æon Þór')).toBe('Strasse AEon Thor')
  })

  it('leaves other scripts alone', () => {
    expect(removeDiacritics('Елена')).toBe('Елена')
  })
})

describe('the title lookup', () => {
  it('has the same key for the spelling of a cinema and that of TMDB', () => {
    expect(normalizeMovieTitleForLookup('Coeur secret')).toBe(
      normalizeMovieTitleForLookup('Cœur secret'),
    )
    expect(normalizeMovieTitleForLookup('Lodz Film')).toBe(
      normalizeMovieTitleForLookup('Łódź Film'),
    )
    expect(normalizeMovieTitleForLookup('Strasse')).toBe(
      normalizeMovieTitleForLookup('Straße'),
    )
  })
})
