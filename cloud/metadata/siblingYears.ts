import pMap from 'p-map'

import getMetadata from './index'
import { getMetadataLookupKey } from './titleResolver'
import { Metadata } from './types'

// The lookups to retry with the years that other screenings of the same title
// matched. That is a lookup that did not match, and a lookup without a year
// that matched only because the most popular of equally good candidates was
// taken: with Lumière and Concordia saying "Leviathan" is from 2014, Forum's
// "Leviathan" without a year is not the more popular 1989 film.
export const needsSiblingYearRetry = (
  metadata: Pick<Metadata, 'year' | 'match'>,
) =>
  metadata.match.status !== 'matched' ||
  (metadata.year === undefined && metadata.match.popularityTieBreak === true)

// Retries the lookups that need it with the years that the screenings of the
// same title matched, and keeps the retry only when it matches. The lookups
// stay in the order they came in, one per title and year.
export const resolveWithSiblingYears = async (
  lookups: Metadata[],
  retry: typeof getMetadata = getMetadata,
) => {
  const matchedYearsByQuery = new Map<string, Set<number>>()
  lookups.forEach((metadata) => {
    if (metadata.match.status !== 'matched' || metadata.year === undefined) {
      return
    }

    const existingYears = matchedYearsByQuery.get(metadata.query) ?? new Set()
    existingYears.add(metadata.year)
    matchedYearsByQuery.set(metadata.query, existingYears)
  })

  const retried = await pMap(
    lookups.filter(
      (metadata) =>
        needsSiblingYearRetry(metadata) &&
        (matchedYearsByQuery.get(metadata.query)?.size ?? 0) > 0,
    ),
    async (metadata) => {
      const siblingYearHints = Array.from(
        matchedYearsByQuery.get(metadata.query) ?? [],
      ).filter((hint) => hint !== metadata.year)

      if (siblingYearHints.length === 0) {
        return metadata
      }

      const retryMetadata = await retry({
        title: metadata.query,
        year: metadata.year,
        siblingYearHints,
      })

      // a retry that doesn't match keeps what the lookup had
      return retryMetadata.match.status === 'matched' ? retryMetadata : metadata
    },
    { concurrency: 5 },
  )

  const byLookupKey = new Map(
    lookups.map((metadata) => [
      getMetadataLookupKey(metadata.query, metadata.year),
      metadata,
    ]),
  )

  retried.forEach((metadata) => {
    byLookupKey.set(
      getMetadataLookupKey(metadata.query, metadata.year),
      metadata,
    )
  })

  return Array.from(byLookupKey.values())
}
