import {
  createSearchCounter,
  markSearchFromTag,
  normaliseSearchTerm,
} from './goatcounter'
import { GOATCOUNTER_CODE } from './goatcounterCode'

describe('normaliseSearchTerm', () => {
  it('lowercases, trims and puts the term on one line', () => {
    expect(normaliseSearchTerm('  Shall   We\nDance? ')).toBe('shall we dance?')
  })

  it('leaves out a term of less than 3 characters', () => {
    expect(normaliseSearchTerm('ab')).toBeNull()
    expect(normaliseSearchTerm('  a ')).toBeNull()
    expect(normaliseSearchTerm('abc')).toBe('abc')
  })

  it('cuts a long term off at 50 characters', () => {
    const term = normaliseSearchTerm('a'.repeat(80))
    expect(term).toHaveLength(50)
  })

  it('leaves out something that looks like an email address', () => {
    expect(normaliseSearchTerm('casper@example.com')).toBeNull()
    expect(normaliseSearchTerm('mail me at x@y.nl')).toBeNull()
  })

  it('leaves out a long number, but keeps a year in a title', () => {
    expect(normaliseSearchTerm('0612345678')).toBeNull()
    expect(normaliseSearchTerm('06 12 34 56 78')).toBeNull()
    expect(normaliseSearchTerm('+31 (0)6 1234 5678')).toBeNull()
    expect(normaliseSearchTerm('blade runner 2049')).toBe('blade runner 2049')
    expect(normaliseSearchTerm('2001: a space odyssey')).toBe(
      '2001: a space odyssey',
    )
  })
})

describe('createSearchCounter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // forget a tag that an earlier test marked
    markSearchFromTag('')
  })
  afterEach(() => jest.useRealTimers())

  it('counts a search once, after a second without a change', () => {
    const count = jest.fn()
    const { search } = createSearchCounter(count)

    search('sha', true)
    jest.advanceTimersByTime(600)
    search('shall', true)
    jest.advanceTimersByTime(600)
    expect(count).not.toHaveBeenCalled()
    jest.advanceTimersByTime(400)

    expect(count).toHaveBeenCalledTimes(1)
    expect(count).toHaveBeenCalledWith('search/shall')
  })

  it('counts a search without result apart', () => {
    const count = jest.fn()
    const { search } = createSearchCounter(count)

    search('Zzzzz', false)
    jest.advanceTimersByTime(1000)

    expect(count).toHaveBeenCalledWith('search-none/zzzzz')
  })

  it('does not count the same search twice in a row', () => {
    const count = jest.fn()
    const { search } = createSearchCounter(count)

    search('shall', true)
    jest.advanceTimersByTime(1000)
    search('shall', true)
    jest.advanceTimersByTime(1000)
    search('Shall ', true)
    jest.advanceTimersByTime(1000)

    expect(count).toHaveBeenCalledTimes(1)
  })

  it('counts nothing for a term that is left out, and drops a pending one', () => {
    const count = jest.fn()
    const { search } = createSearchCounter(count)

    search('shall', true)
    search('', true)
    jest.advanceTimersByTime(2000)
    search('a@b.nl', true)
    jest.advanceTimersByTime(2000)

    expect(count).not.toHaveBeenCalled()
  })

  it('counts the search that follows a click on a tag as from the tag', () => {
    const count = jest.fn()
    const { search } = createSearchCounter(count)

    markSearchFromTag('30th Anniversary')
    search('30th anniversary', true)
    jest.advanceTimersByTime(1000)
    // typing it again later is a search
    search('nagesprek', true)
    jest.advanceTimersByTime(1000)
    search('30th anniversary', true)
    jest.advanceTimersByTime(1000)

    expect(count.mock.calls.map(([path]) => path)).toEqual([
      'search-tag/30th anniversary',
      'search/nagesprek',
      'search/30th anniversary',
    ])
  })
})

describe('counting', () => {
  const count = jest.fn()

  afterEach(() => {
    count.mockReset()
    delete (globalThis as { window?: unknown }).window
  })

  const load = (code: string) => {
    let loaded!: typeof import('./goatcounter')
    jest.isolateModules(() => {
      jest.doMock('./goatcounterCode', () => ({ GOATCOUNTER_CODE: code }))
      loaded = require('./goatcounter')
    })
    return loaded
  }

  it('does nothing while the code is empty', () => {
    ;(globalThis as { window?: unknown }).window = { goatcounter: { count } }
    const { countPageView, countEvent, countOutbound } = load('')

    countPageView('/city/den-haag')
    countEvent('search/shall')
    countOutbound('filmhuis-den-haag')

    expect(count).not.toHaveBeenCalled()
  })

  it('counts a page view and events once there is a code', () => {
    ;(globalThis as { window?: unknown }).window = { goatcounter: { count } }
    const { countPageView, countEvent, countOutbound } = load('example')

    countPageView('/city/den-haag')
    countEvent('search/shall')
    countOutbound('filmhuis-den-haag')
    countOutbound('filmhuis-den-haag', 'frank')

    expect(count.mock.calls).toEqual([
      [{ path: '/city/den-haag' }],
      [{ path: 'search/shall', event: true }],
      [{ path: 'outbound/filmhuis-den-haag', event: true }],
      [{ path: 'outbound/filmhuis-den-haag/frank', event: true }],
    ])
  })

  it('has the code of the site, which is a valid subdomain', () => {
    expect(GOATCOUNTER_CODE).toMatch(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
  })

  it('does nothing without window or without GoatCounter on it', () => {
    const { countPageView, countEvent } = load('example')
    expect(() => countPageView('/')).not.toThrow()
    ;(globalThis as { window?: unknown }).window = {}
    expect(() => countEvent('outbound/x')).not.toThrow()
  })
})
