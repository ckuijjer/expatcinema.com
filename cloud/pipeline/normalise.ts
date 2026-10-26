import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { withEvent } from '../scrapers/utils/extractEvent'
import { logger } from '../powertools'
import { Screening } from '../types'

// A screening without a valid date can't be sorted (the comparator returns NaN,
// which makes the order of the whole list depend on where it sits) or shown. It
// is left out, with a warning, which is forwarded to Slack
const hasValidDate = ({ date }: Screening) =>
  date instanceof Date && !Number.isNaN(date.getTime())

// 1900 is what some cinema systems have for a film with no year: Filmhuis Den
// Haag's page for Frank says "Verenigd Koninkrijk, Ierland, Verenigde Staten , 1900"
// (the film is from 2014), and Lumière gives it to its events. No film shown with
// English subtitles is from 1900, and a wrong year keeps the matching from the
// right film, so it is the same as no year
const PLACEHOLDER_YEAR = 1900

const withoutPlaceholderYear = (screening: Screening): Screening => {
  const { year, ...rest } = screening
  return year === PLACEHOLDER_YEAR ? rest : screening
}

// Phase: normalise. What a scraper returns, without the screenings that have no
// valid date and the placeholder year, with the event it didn't set itself taken from the title, once per
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
    screenings.filter(hasValidDate).map(withoutPlaceholderYear).map(withEvent),
  )
}

// and the results of all scrapers as one list
export const combineScreenings = (
  resultsPerScraper: Record<string, Screening[]>,
) => makeScreeningsUniqueAndSorted(Object.values(resultsPerScraper).flat())
