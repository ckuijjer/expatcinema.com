import { Logger } from '@aws-lambda-powertools/logger'

import { Screening } from '../types'
import { extractScreeningsFromPages } from '../scrapers/utils/extractScreeningsFromPages'

const screening = (title: string): Screening => ({
  title,
  url: `https://example.com/${title}`,
  cinema: 'Test',
  date: new Date('2026-01-01T20:00:00Z'),
})

const makeLogger = () =>
  ({ warn: jest.fn(), info: jest.fn() }) as unknown as Logger & {
    warn: jest.Mock
    info: jest.Mock
  }

describe('extractScreeningsFromPages', () => {
  test('flattens the screenings from every page', async () => {
    const logger = makeLogger()

    const result = await extractScreeningsFromPages(
      ['a', 'b'],
      async (item) => [screening(item)],
      { logger },
    )

    expect(result.map((s) => s.title)).toEqual(['a', 'b'])
    expect(logger.warn).not.toHaveBeenCalled()
  })

  test('a single failing page does not zero out the rest', async () => {
    const logger = makeLogger()

    const result = await extractScreeningsFromPages(
      ['ok-1', 'boom', 'ok-2'],
      async (item) => {
        if (item === 'boom') throw new Error('network blip')
        return [screening(item)]
      },
      { logger },
    )

    expect(result.map((s) => s.title)).toEqual(['ok-1', 'ok-2'])
  })

  test('logs each failed page as a warning with the url and error', async () => {
    const logger = makeLogger()
    const error = new Error('network blip')

    await extractScreeningsFromPages(
      ['https://example.com/boom'],
      async () => {
        throw error
      },
      { logger },
    )

    expect(logger.warn).toHaveBeenCalledWith(
      'failed to extract screenings from page',
      { url: 'https://example.com/boom', error },
    )
  })

  test('warns when every page fails, not when only some do', async () => {
    const allFail = makeLogger()
    await extractScreeningsFromPages(
      ['a', 'b'],
      async () => {
        throw new Error('blocked')
      },
      { logger: allFail },
    )
    expect(allFail.warn).toHaveBeenCalledWith(
      'failed to extract screenings from every page',
      { pages: 2, failed: 2, screenings: 0 },
    )

    const someFail = makeLogger()
    await extractScreeningsFromPages(
      ['ok', 'boom'],
      async (item) => {
        if (item === 'boom') throw new Error('blip')
        return [screening(item)]
      },
      { logger: someFail },
    )
    expect(someFail.warn).not.toHaveBeenCalledWith(
      'failed to extract screenings from every page',
      expect.anything(),
    )
    expect(someFail.info).toHaveBeenCalledWith(
      'extracted screenings from pages',
      { pages: 2, failed: 1, screenings: 1 },
    )
  })

  test('pages that load without screenings are only logged as info', async () => {
    const logger = makeLogger()

    await extractScreeningsFromPages(['a', 'b'], async () => [], { logger })

    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      'extracted screenings from pages',
      {
        pages: 2,
        failed: 0,
        screenings: 0,
      },
    )
  })

  test('url selector extracts the page url from an object item', async () => {
    const logger = makeLogger()

    await extractScreeningsFromPages(
      [{ title: 'X', url: 'https://example.com/x' }],
      async () => {
        throw new Error('boom')
      },
      { logger, url: (item) => item.url },
    )

    expect(logger.warn).toHaveBeenCalledWith(
      'failed to extract screenings from page',
      expect.objectContaining({ url: 'https://example.com/x' }),
    )
  })

  test('concurrency limits how many pages are fetched at the same time', async () => {
    let running = 0
    let maxRunning = 0

    const screenings = await extractScreeningsFromPages(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      async (item) => {
        running += 1
        maxRunning = Math.max(maxRunning, running)
        await new Promise((resolve) => setTimeout(resolve, 5))
        running -= 1
        return [screening(item)]
      },
      { logger: makeLogger(), concurrency: 3 },
    )

    expect(screenings).toHaveLength(7)
    expect(maxRunning).toBe(3)
  })
})
