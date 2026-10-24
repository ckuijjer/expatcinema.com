import { closeBrowser } from '../browser'
import { logger } from '../powertools'
import type { Scraper } from '../scrapers/registry'
import { withTimeout } from '../scrapers/utils/withTimeout'
import { Screening } from '../types'

// The Lambda is killed after 9 minutes, losing every scraper's results, so a
// scraper that hangs gets cut off well before that (the slowest take ~1 minute)
const SCRAPER_TIMEOUT_MS = 4 * 60 * 1000

// Phase: scrape. Runs the scrapers, all at once. A scraper that fails or takes
// too long gives no screenings, and doesn't stop the others. What comes out is
// what each scraper returned, not yet cleaned up.
export const runScrapers = async (scrapers: Record<string, Scraper>) => {
  const results = Object.fromEntries(
    await Promise.all(
      Object.entries(scrapers).map(async ([name, fn]) => {
        logger.info('start scraping', { scraper: name })

        const start = Date.now()
        let result: Screening[] = []
        try {
          result = await withTimeout(
            fn(),
            SCRAPER_TIMEOUT_MS,
            `scraper ${name}`,
          )
        } catch (error) {
          logger.error('error scraping (scrapers Promise.all loop)', {
            scraper: name,
            error,
          })
        }

        logger.info('done scraping', {
          scraper: name,
          numberOfResults: result?.length,
          durationMs: Date.now() - start,
        })

        return [name, result]
      }),
    ),
  ) as Record<string, Screening[]>

  // close the browser
  try {
    await closeBrowser({ logger })
  } catch (error) {
    logger.warn('failed closing browser', { error })
  }

  logger.info('done scraping for all scrapers')

  return results
}
