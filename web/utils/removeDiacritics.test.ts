import { normalizeSearchText, removeDiacritics } from './removeDiacritics'

describe('removeDiacritics', () => {
  it('removes the accents that Unicode can decompose', () => {
    expect(removeDiacritics('Céline Sciamma')).toBe('Celine Sciamma')
    expect(removeDiacritics('Łódź Žižek Ångström')).toBe('Lodz Zizek Angstrom')
  })

  it('writes the letters without a diacritic as ASCII letters', () => {
    expect(removeDiacritics('Paweł Pawlikowski')).toBe('Pawel Pawlikowski')
    expect(removeDiacritics("Kasper 'Kalle' Skovsbøl")).toBe(
      "Kasper 'Kalle' Skovsbol",
    )
    expect(removeDiacritics('Srđan Karanović')).toBe('Srdan Karanovic')
    expect(removeDiacritics('Andrzej Żuławski')).toBe('Andrzej Zulawski')
    expect(removeDiacritics('Cœur secret')).toBe('Coeur secret')
    expect(removeDiacritics('Boşluğa xütbə')).toBe('Bosluga xutbe')
    expect(removeDiacritics('Straße Æon Þór')).toBe('Strasse AEon Thor')
  })

  it('leaves other scripts and plain text alone', () => {
    expect(removeDiacritics('Frank')).toBe('Frank')
    expect(removeDiacritics('Елена')).toBe('Елена')
  })
})

describe('normalizeSearchText', () => {
  it('lowercases and removes diacritics', () => {
    expect(normalizeSearchText('Paweł ŁOZIŃSKI')).toBe('pawel lozinski')
  })

  it('writes typographic apostrophes, dashes and × as a keyboard does', () => {
    expect(normalizeSearchText('L’Inconnue')).toBe("l'inconnue")
    expect(normalizeSearchText('Azart – Come Make Art')).toBe(
      'azart - come make art',
    )
    expect(normalizeSearchText('3×3 Eyes')).toBe('3x3 eyes')
  })
})
