import { matchesScreeningSearch } from './searchMatches'

const screening = {
  title: 'Minimum Love',
  year: 2025,
  cinema: { name: 'Filmhuis Den Haag', city: { name: 'Den Haag' } },
}

const search = (value: string) => value.split(/\s+/)

describe('matchesScreeningSearch', () => {
  test('matches without a search', () => {
    expect(matchesScreeningSearch(screening, [])).toBe(true)
  })

  test('matches the title, the year, the cinema and the city', () => {
    expect(matchesScreeningSearch(screening, search('minimum'))).toBe(true)
    expect(matchesScreeningSearch(screening, search('2025'))).toBe(true)
    expect(matchesScreeningSearch(screening, search('filmhuis'))).toBe(true)
    expect(matchesScreeningSearch(screening, search('haag'))).toBe(true)
    expect(matchesScreeningSearch(screening, search('rotterdam'))).toBe(false)
  })

  test('matches the event, in any case', () => {
    const withEvent = { ...screening, event: 'ENFF' }

    expect(matchesScreeningSearch(withEvent, search('enff'))).toBe(true)
    expect(matchesScreeningSearch(withEvent, search('enf'))).toBe(true)
    expect(matchesScreeningSearch(screening, search('enff'))).toBe(false)
  })

  test('matches an event of more than one word', () => {
    const withEvent = { ...screening, event: 'Imagine Film Festival' }

    expect(
      matchesScreeningSearch(withEvent, search('imagine film festival')),
    ).toBe(true)
    expect(matchesScreeningSearch(withEvent, search('imagine love'))).toBe(true)
    expect(matchesScreeningSearch(withEvent, search('imagine rotterdam'))).toBe(
      false,
    )
  })

  test('matches a note', () => {
    const withNotes = { ...screening, notes: ['nagesprek', '4K Restoration'] }

    expect(matchesScreeningSearch(withNotes, search('nagesprek'))).toBe(true)
    expect(matchesScreeningSearch(withNotes, search('4k'))).toBe(true)
    expect(matchesScreeningSearch(withNotes, search('q&a'))).toBe(false)
  })

  test('matches an event or note without its accents', () => {
    const withEvent = {
      ...screening,
      event: 'CinéDialoog',
      notes: ['Première'],
    }

    expect(matchesScreeningSearch(withEvent, search('cinedialoog'))).toBe(true)
    expect(matchesScreeningSearch(withEvent, search('premiere'))).toBe(true)
  })

  test('every word has to match something, in any field', () => {
    const withEvent = { ...screening, event: 'ENFF', notes: ['nagesprek'] }

    expect(
      matchesScreeningSearch(withEvent, search('enff nagesprek haag')),
    ).toBe(true)
    expect(
      matchesScreeningSearch(withEvent, search('enff nagesprek utrecht')),
    ).toBe(false)
  })
})
