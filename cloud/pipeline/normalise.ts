import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { withEvent } from '../scrapers/utils/extractEvent'
import { logger } from '../powertools'
import { Screening } from '../types'

// A screening without a valid date can't be sorted (the comparator returns NaN,
// which makes the order of the whole list depend on where it sits) or shown. It
// is left out, with a warning, which is forwarded to Slack
const hasValidDate = ({ date }: Screening) =>
  date instanceof Date && !Number.isNaN(date.getTime())

// Phase: normalise. What a scraper returns, without the screenings that have no
// valid date, with the event it didn't set itself taken from the title, once per
// screening, sorted
export const normaliseScraperResult = (
  screenings: Screening[],
  scraper?: string,
) => {
  const invalid = screenings.filter((screening) => !hasValidDate(screening))

  if (invalid.length > 0) {
    logger.warn('leaving out screenings without a valid date', {
      scraper,
      count: invalid.length,
      screenings: invalid.slice(0, 5).map(({ title, url, date }) => ({
        title,
        url,
        date: String(date),
      })),
    })
  }

  return makeScreeningsUniqueAndSorted(
    screenings.filter(hasValidDate).map(withEvent),
  )
}

// and the results of all scrapers as one list
export const combineScreenings = (
  resultsPerScraper: Record<string, Screening[]>,
) => makeScreeningsUniqueAndSorted(Object.values(resultsPerScraper).flat())
