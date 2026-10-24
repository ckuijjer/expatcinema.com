import { Settings } from 'luxon'

import { resolveMetadata } from '../metadata/resolveMetadata'
import {
  combineScreenings,
  normaliseScraperResult,
} from '../pipeline/normalise'
import { createPublisher } from '../pipeline/publish'
import { resolveScreenings } from '../pipeline/resolve'
import { runScrapers } from '../pipeline/scrape'
import { logger } from '../powertools'
import { getEnabledScrapers, SCRAPERS } from './registry'

// Set the default timezone to Europe/Amsterdam, otherwise AWS Lambda will scrape as UTC and running it locally
// as Europe/Amsterdam
Settings.defaultZone = 'Europe/Amsterdam'

const publish = createPublisher()

// The phases, in order: scrape, normalise, match (merge the screenings into
// lookups, find the movie of each), resolve, publish. Each takes what the one
// before it returned, see pipeline/ and metadata/resolveMetadata.ts
export const scrapers = async () => {
  try {
    const enabledScrapers = getEnabledScrapers()

    logger.info('starting scrapers', {
      availableScrapers: Object.keys(SCRAPERS).length,
      enabledScrapers: Object.keys(enabledScrapers).length,
      enabled: Object.keys(enabledScrapers),
    })

    const resultsPerScraper = Object.fromEntries(
      Object.entries(await runScrapers(enabledScrapers)).map(
        ([name, result]) => [name, normaliseScraperResult(result, name)],
      ),
    )
    const allRawScreenings = combineScreenings(resultsPerScraper)

    const { metadataLookups, metadata } =
      await resolveMetadata(allRawScreenings)

    const resolved = resolveScreenings(allRawScreenings, {
      metadata,
      metadataLookups,
    })

    await publish({ resultsPerScraper, allRawScreenings, resolved })
  } catch (error) {
    logger.error('error scraping (main loop)', { error })
  }
}
