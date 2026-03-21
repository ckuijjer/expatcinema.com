import { titleCase } from '../scrapers/utils/titleCase'

// ─── titleCase ───────────────────────────────────────────────────────────────

describe('titleCase', () => {
  test('capitalizes basic words', () => {
    expect(titleCase('the dark knight')).toBe('The Dark Knight')
  })

  test('keeps minor words lowercase when not first', () => {
    expect(titleCase('beauty and the beast')).toBe('Beauty and the Beast')
    expect(titleCase('in the mood for love')).toBe('In the Mood for Love')
    expect(titleCase('of mice and men')).toBe('Of Mice and Men')
  })

  test('capitalizes first word even if it is a minor word', () => {
    expect(titleCase('a beautiful mind')).toBe('A Beautiful Mind')
    expect(titleCase('the godfather')).toBe('The Godfather')
  })

  test('preserves Roman numerals as uppercase', () => {
    expect(titleCase('rocky II')).toBe('Rocky II')
    expect(titleCase('part III of the story')).toBe('Part III of the Story')
    expect(titleCase('star wars episode IV a new hope')).toBe(
      'Star Wars Episode IV a New Hope',
    )
    expect(titleCase('chapter VIII')).toBe('Chapter VIII')
    expect(titleCase('godfather part II')).toBe('Godfather Part II')
  })

  test('preserves single-letter Roman numerals', () => {
    expect(titleCase('fallout I')).toBe('Fallout I')
    expect(titleCase('fallout V')).toBe('Fallout V')
    expect(titleCase('fallout X')).toBe('Fallout X')
  })

  test('trims leading and trailing whitespace', () => {
    expect(titleCase('  hello world  ')).toBe('Hello World')
  })

  test('replaces fancy apostrophes with normal ones', () => {
    expect(titleCase('i\u2019m still here')).toBe("I'm Still Here")
  })
})

// ─── isRomanNumeral (via titleCase behaviour) ────────────────────────────────

// These tests verify that words which look like Roman numerals but are not
// valid are correctly capitalised rather than kept uppercase.

describe('titleCase – Roman numeral detection', () => {
  // Valid Roman numerals: preserved as-is (uppercase)
  const validNumerals = [
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
    'XIV',
    'XIX',
    'XX',
    'XL',
    'L',
    'XC',
    'C',
    'CD',
    'D',
    'CM',
    'M',
    'XLVII',
    'MCMXCIX',
    'MMXXIV',
  ]

  test.each(validNumerals)('"%s" is treated as a Roman numeral', (numeral) => {
    expect(titleCase(`part ${numeral}`)).toBe(`Part ${numeral}`)
  })

  // Invalid sequences: should be capitalised (first letter up, rest down)
  const invalidNumerals: [string, string][] = [
    ['IXVI', 'Ixvi'], // the original FIXME case
    ['IIV', 'Iiv'], // two I's before V
    ['VV', 'Vv'], // V cannot repeat
    ['IIII', 'Iiii'], // I can repeat at most three times
    ['LC', 'Lc'], // L before C is not a valid subtraction pair
    ['MMMM', 'Mmmm'], // M can repeat at most three times (1–3999 range)
    ['IXI', 'Ixi'], // IX followed by I is invalid
    ['VX', 'Vx'], // V before X is not a valid subtraction pair
  ]

  test.each(invalidNumerals)(
    '"%s" is NOT a Roman numeral and gets capitalised to "%s"',
    (input, expected) => {
      expect(titleCase(`part ${input}`)).toBe(`Part ${expected}`)
    },
  )
})
