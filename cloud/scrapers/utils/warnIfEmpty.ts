import { Logger } from '@aws-lambda-powertools/logger'

type Options = {
  // For a listing whose English-subtitle marker is an exact tag or field,
  // where none is more likely a changed marker than a quiet week: warn on it
  // too, instead of logging info
  warnWhenNoneSubtitled?: boolean
  // Extra context for the log line, e.g. the tags the listing does have
  details?: Record<string, unknown>
}

type Counts = {
  // What the listing returned, before any filtering: films, productions, shows
  listed: number
  // Of those, the ones that have English subtitles
  subtitled: number
  // What ended up as screenings
  screenings: number
}

/**
 * Tells an empty result that is a quiet week from one that is a broken
 * scraper, so the daily check only has to look at the second kind.
 *
 * - nothing listed: the listing is empty, blocked or no longer parsed. Warn
 * - listed, none with English subtitles: a quiet week, or the subtitle marker
 *   changed. Info with the counts, as that can't be told apart from here,
 *   unless `warnWhenNoneSubtitled` (Cinecenter: seen 2026-10-28, 0 after 9)
 * - subtitled items, but no screenings: the dates or shows are gone. Warn
 *
 * A scraper that gets this far has its listing in hand, so `listed` should be
 * counted where the listing is parsed, not after the subtitle filter.
 */
export const warnIfEmpty = (
  logger: Logger,
  { listed, subtitled, screenings }: Counts,
  { warnWhenNoneSubtitled = false, details }: Options = {},
) => {
  const counts = { listed, subtitled, screenings, ...details }

  if (listed === 0) {
    logger.warn('the listing has no items, scraper is probably broken', counts)
  } else if (subtitled === 0 && warnWhenNoneSubtitled) {
    logger.warn('no items with English subtitles', counts)
  } else if (subtitled === 0) {
    logger.info('no items with English subtitles', counts)
  } else if (screenings === 0) {
    logger.warn('items with English subtitles but no screenings', counts)
  }
}
