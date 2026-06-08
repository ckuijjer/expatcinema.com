import { Logger } from '@aws-lambda-powertools/logger'

import { Screening } from '../../types'

type ExtractFromPage<Item> = (item: Item) => Promise<Screening[]>

type Options<Item> = {
  logger: Logger
  // Describe an item in the warning log when its page fails. Defaults to the
  // item itself (objects like `{ title, url }` log fine; URLs log as-is).
  describe?: (item: Item) => unknown
}

/**
 * Runs `extract` over every `item` concurrently and returns the flattened
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
  { logger, describe = (item) => item }: Options<Item>,
): Promise<Screening[]> => {
  const results = await Promise.allSettled(
    // pRetry seam: wrap this call to retry an individual film page.
    items.map((item) => extract(item)),
  )

  return results.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }

    logger.warn('failed to extract screenings from page', {
      item: describe(items[index]),
      error: result.reason,
    })

    return []
  })
}
