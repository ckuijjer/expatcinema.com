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
  ({ warn: jest.fn() } as unknown as Logger & { warn: jest.Mock })

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

    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'failed to extract screenings from page',
      { url: 'https://example.com/boom', error },
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
})
