import { Logger } from '@aws-lambda-powertools/logger'
import pMap from 'p-map'

import { Screening } from '../../types'

type ExtractFromPage<Item> = (item: Item) => Promise<Screening[]>

type Options<Item> = {
  logger: Logger
  // Extract the page URL from an item for the failure log. Defaults to the
  // item itself, which is correct when items are already URL strings.
  url?: (item: Item) => unknown
  // How many pages are fetched at the same time, all of them by default. Needs
  // to stay below the relay's MAX_CONCURRENT (10) for pages that are relayed
  concurrency?: number
}

/**
 * Runs `extract` over every `item` concurrently (all at once unless `concurrency` is set) and returns the flattened
 * screenings.
 *
 * Unlike a bare `Promise.all`, a single failing page does not reject the whole
 * batch: rejected pages are logged as a warning and contribute no screenings,
 * so one flaky film page can't zero out an entire cinema.
 *
 * `extract` is invoked once per item on the marked line below — that is the
 * seam for adding a per-film-page `pRetry` later without touching call sites.
 */
export const extractScreeningsFromPages = async <Item>(
  items: Item[],
  extract: ExtractFromPage<Item>,
  { logger, url = (item) => item, concurrency = Infinity }: Options<Item>,
): Promise<Screening[]> => {
  const results = await pMap(
    items,
    // pRetry seam: wrap this call to retry an individual film page.
    (item): Promise<PromiseSettledResult<Screening[]>> =>
      extract(item).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason }),
      ),
    { concurrency },
  )

  return results.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }

    logger.warn('failed to extract screenings from page', {
      url: url(items[index]),
      error: result.reason,
    })

    return []
  })
}
