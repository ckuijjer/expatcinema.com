import {
  cleanDirector,
  findDirectorInLines,
} from '../scrapers/utils/cleanDirector'

describe('cleanDirector', () => {
  test('decodes entities, collapses whitespace and trims', () => {
    expect(cleanDirector('  Marie-H&eacute;l&egrave;ne   Roux ')).toBe(
      'Marie-Hélène Roux',
    )
  })

  test('drops a leading label and trailing punctuation', () => {
    expect(cleanDirector('Regie: Sandra Radecka, Machiel Spruijt,')).toBe(
      'Sandra Radecka, Machiel Spruijt',
    )
  })

  test('empty gives undefined', () => {
    expect(cleanDirector('  ')).toBeUndefined()
    expect(cleanDirector(null)).toBeUndefined()
    expect(cleanDirector(undefined)).toBeUndefined()
  })
})

describe('findDirectorInLines', () => {
  test('finds the director line', () => {
    expect(findDirectorInLines(['Jaar: 2025', 'Regie: Annemarie Jacir'])).toBe(
      'Annemarie Jacir',
    )
  })

  test('no director line gives undefined', () => {
    expect(findDirectorInLines(['Jaar: 2025'])).toBeUndefined()
    expect(findDirectorInLines(undefined)).toBeUndefined()
  })
})
