import { isLatinScript, pickDisplayTitle } from '../metadata/titleResolver'

describe('isLatinScript', () => {
  test.each([
    'Zimna wojna',
    'Cléo de 5 à 7',
    'Sirāt',
    "L'Amour à la mer",
    'Giant - The Play',
    '2001: A Space Odyssey',
  ])('%p is Latin', (title) => {
    expect(isLatinScript(title)).toBe(true)
  })

  test.each([
    'रामायण',
    '강다니엘: 홀드 유어 브레스',
    'GROTESQQQUE -グロテスク-',
    '東京物語',
    'Рамаяна',
  ])('%p is not Latin', (title) => {
    expect(isLatinScript(title)).toBe(false)
  })
})

describe('pickDisplayTitle', () => {
  test('uses the TMDB title when the original title is not Latin', () => {
    expect(
      pickDisplayTitle('ramayana', 'Ramayana: Rise of a Legend', 'रामायण'),
    ).toBe('Ramayana: Rise of a Legend')
    expect(
      pickDisplayTitle(
        'hold your breath',
        'Kangdaniel: Hold Your Breath',
        '강다니엘: 홀드 유어 브레스',
      ),
    ).toBe('Kangdaniel: Hold Your Breath')
  })

  test('keeps the title closest to the cinema title when both are Latin', () => {
    expect(pickDisplayTitle('lola rennt', 'Run Lola Run', 'Lola rennt')).toBe(
      'Lola rennt',
    )
    expect(pickDisplayTitle('run lola run', 'Run Lola Run', 'Lola rennt')).toBe(
      'Run Lola Run',
    )
  })

  test('uses the original title when TMDB has no title', () => {
    expect(pickDisplayTitle('x', undefined, 'रामायण')).toBe('रामायण')
  })

  test('falls back to the cinema title without any', () => {
    expect(pickDisplayTitle('x')).toBe('x')
  })
})
