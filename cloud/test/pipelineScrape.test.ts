import { closeBrowser } from '../browser'
import {
  combineScreenings,
  normaliseScraperResult,
} from '../pipeline/normalise'
import { runScrapers } from '../pipeline/scrape'
import { getEnabledScrapers, SCRAPERS } from '../scrapers/registry'
import { Screening } from '../types'

jest.mock('../browser', () => ({ closeBrowser: jest.fn() }))

const screening = (overrides: Partial<Screening>): Screening => ({
  title: 'Cure',
  url: 'https://example.com/cure',
  cinema: 'Lab111',
  date: new Date('2026-10-31T17:40:00Z'),
  ...overrides,
})

describe('runScrapers', () => {
  test('returns what every scraper returned, as it is', async () => {
    const first = [screening({ title: 'Imagine Film Festival: Cure' })]
    const second = [screening({ title: 'Possession', cinema: 'Rialto' })]

    expect(
      await runScrapers({
        lab111: async () => first,
        rialto: async () => second,
      }),
    ).toEqual({ lab111: first, rialto: second })
  })

  test('a scraper that fails gives no screenings, and the others go on', async () => {
    const result = await runScrapers({
      broken: async () => {
        throw new Error('the site changed')
      },
      working: async () => [screening({})],
    })

    expect(result).toEqual({ broken: [], working: [screening({})] })
  })

  test('closes the browser after the scrapers', async () => {
    await runScrapers({ working: async () => [] })

    expect(closeBrowser).toHaveBeenCalled()
  })

  test('a browser that does not close does not lose the results', async () => {
    ;(closeBrowser as jest.Mock).mockRejectedValueOnce(new Error('gone'))

    expect(await runScrapers({ working: async () => [] })).toEqual({
      working: [],
    })
  })
})

describe('normalise', () => {
  test('takes the event of a title the scraper left as it was, and removes duplicates', () => {
    const imagine = screening({ title: 'Imagine Film Festival: Cure' })

    expect(normaliseScraperResult([imagine, imagine])).toEqual([
      screening({ title: 'Cure', event: 'Imagine Film Festival' }),
    ])
  })

  test('keeps the event a scraper set itself', () => {
    expect(
      normaliseScraperResult([
        screening({ title: 'Docs: Naza', event: 'Docs on Tour' }),
      ]),
    ).toEqual([screening({ title: 'Naza', event: 'Docs on Tour' })])
  })

  test('combines the results of all scrapers, sorted by date', () => {
    const late = screening({ date: new Date('2026-11-02T20:00:00Z') })
    const early = screening({
      title: 'Possession',
      date: new Date('2026-11-01T20:00:00Z'),
    })

    expect(combineScreenings({ a: [late], b: [early, late] })).toEqual([
      early,
      late,
    ])
  })
})

describe('getEnabledScrapers', () => {
  const original = process.env.SCRAPERS
  afterEach(() => {
    if (original === undefined) delete process.env.SCRAPERS
    else process.env.SCRAPERS = original
  })

  test('is every scraper without SCRAPERS', () => {
    delete process.env.SCRAPERS

    expect(getEnabledScrapers()).toBe(SCRAPERS)
  })

  test('is only the scrapers that SCRAPERS lists', () => {
    process.env.SCRAPERS = 'concordia,lab111,notascraper'

    expect(Object.keys(getEnabledScrapers())).toEqual(
      expect.arrayContaining(['concordia', 'lab111']),
    )
    expect(Object.keys(getEnabledScrapers())).toHaveLength(2)
  })
})
