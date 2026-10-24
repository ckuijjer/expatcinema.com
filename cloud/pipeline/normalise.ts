import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { withEvent } from '../scrapers/utils/extractEvent'
import { Screening } from '../types'

// Phase: normalise. What a scraper returns, with the event it didn't set itself
// taken from the title, once per screening, sorted
export const normaliseScraperResult = (screenings: Screening[]) =>
  makeScreeningsUniqueAndSorted(screenings.map(withEvent))

// and the results of all scrapers as one list
export const combineScreenings = (
  resultsPerScraper: Record<string, Screening[]>,
) => makeScreeningsUniqueAndSorted(Object.values(resultsPerScraper).flat())
