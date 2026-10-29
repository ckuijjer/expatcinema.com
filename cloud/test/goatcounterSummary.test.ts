import { summarise } from '../goatcounterSummary'

describe('summarise', () => {
  const hits = [
    { path: '/', count: 50, event: false },
    { path: '/movie/frank', count: 7, event: false },
    { path: 'search/frank', count: 3, event: true },
    { path: 'search/frank', count: 1, event: true },
    { path: 'search-none/zzzz', count: 2, event: true },
    { path: 'search-tag/30th anniversary', count: 4, event: true },
    { path: 'outbound/eye', count: 5, event: true },
    { path: 'outbound/eye/frank', count: 2, event: true },
    { path: 'outbound/kriterion/frank', count: 1, event: true },
  ]

  it('splits pages and the kinds of events', () => {
    const out = summarise(hits, 40)

    expect(out).toContain('Visitors: 40')
    expect(out).toContain(
      'Clicks out to a cinema: 8, searches: 6 (2 without a result)',
    )
    expect(out).toContain('- /: 50')
    expect(out).toContain('- frank: 4')
    expect(out).toContain('- zzzz: 2')
    expect(out).toContain('- 30th anniversary: 4')
    expect(out).toContain('- eye: 7')
    expect(out).toContain('- frank (eye): 2')
  })

  it('says none for what is empty', () => {
    expect(summarise([])).toContain('### Searches\n- none')
  })
})
