import { getInitials } from './getInitials'

describe('getInitials', () => {
  test('returns two initials for a regular two-word title', () => {
    expect(getInitials('Silent Friend')).toBe('SF')
  })

  test('returns initials from first two alpha words (including articles)', () => {
    expect(getInitials('In the Mood for Love')).toBe('IT')
  })

  test('returns single initial for a one-word title', () => {
    expect(getInitials('Parasite')).toBe('P')
  })

  test('skips digit-prefixed words: "10s across the Border" → "AT"', () => {
    expect(getInitials('10s across the Border')).toBe('AT')
  })

  test('strips leading parenthesis: "1900 (Novecento)" → "N"', () => {
    expect(getInitials('1900 (Novecento)')).toBe('N')
  })

  test('skips bare punctuation tokens: "Bagasi - What we Carry" → "BW"', () => {
    expect(getInitials('Bagasi - What we Carry')).toBe('BW')
  })

  test('returns empty string when no alphabetic words found', () => {
    expect(getInitials('1984 2001')).toBe('')
  })

  test('is case-insensitive on input but returns uppercase initials', () => {
    expect(getInitials('the white ribbon')).toBe('TW')
  })

  test('handles leading/trailing whitespace', () => {
    expect(getInitials('  Hard Boiled  ')).toBe('HB')
  })

  test('strips leading parenthesis and uses the inner word', () => {
    expect(getInitials('(Parenthesised Title)')).toBe('PT')
  })
})
