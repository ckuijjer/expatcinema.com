import pMap from 'p-map'

import { Screening } from '../types'
import getMetadata from './index'
import {
  getTitlesWithoutSharedLabels,
  resolveWithoutSharedLabels,
} from './sharedLabels'
import { resolveWithSiblingYears } from './siblingYears'
import { resolveWithTitleParts } from './titleParts'
import {
  getMetadataLookupKey,
  normalizeMovieTitleForLookup,
} from './titleResolver'

// Resolves the movie of every unique title and year of the screenings: the
// title as it is, without the festival or series label several titles of a
// cinema have, as the part of a title that is the film, and with the years of
// the same film at other screenings as a hint
export const resolveMetadata = async (
  allRawScreenings: Screening[],
  { useDirectors = true }: { useDirectors?: boolean } = {},
) => {
  const metadataLookups = new Map<
    string,
    { query: string; year?: number; rawTitles: Set<string> }
  >()
  // what the cinemas say the director is of the screenings with this title and
  // year
  const directorsByLookupKey = new Map<string, string[]>()
  allRawScreenings.forEach(({ title, year, director }) => {
    if (!useDirectors || !director) return

    const lookupKey = getMetadataLookupKey(title, year)
    directorsByLookupKey.set(
      lookupKey,
      Array.from(
        new Set([...(directorsByLookupKey.get(lookupKey) ?? []), director]),
      ),
    )
  })

  allRawScreenings.forEach(({ title, year }) => {
    const query = normalizeMovieTitleForLookup(title)
    const lookupKey = getMetadataLookupKey(title, year)
    const existingLookup = metadataLookups.get(lookupKey) ?? {
      query,
      year,
      rawTitles: new Set<string>(),
    }
    existingLookup.rawTitles.add(title)
    metadataLookups.set(lookupKey, existingLookup)
  })

  const primaryMetadata = await pMap(
    Array.from(metadataLookups.values())
      .sort((left, right) => {
        const leftRawTitle = Array.from(left.rawTitles)[0] ?? ''
        const rightRawTitle = Array.from(right.rawTitles)[0] ?? ''
        return leftRawTitle.localeCompare(rightRawTitle)
      })
      .map((lookup) => ({
        title: Array.from(lookup.rawTitles)[0] ?? '',
        year: lookup.year,
        directors: directorsByLookupKey.get(
          getMetadataLookupKey(lookup.query, lookup.year),
        ),
      })),
    getMetadata,
    {
      concurrency: 5,
    },
  )

  // a title that doesn't match, retried without the festival, series or
  // event name that several titles at its cinema have
  const titlesWithoutSharedLabels =
    getTitlesWithoutSharedLabels(allRawScreenings)

  const metadataWithoutSharedLabels = await pMap(
    primaryMetadata,
    (metadata) =>
      resolveWithoutSharedLabels(
        metadata,
        Array.from(
          metadataLookups.get(
            getMetadataLookupKey(metadata.query, metadata.year),
          )?.rawTitles ?? [],
        ).flatMap((rawTitle) => titlesWithoutSharedLabels.get(rawTitle) ?? []),
        directorsByLookupKey.get(
          getMetadataLookupKey(metadata.query, metadata.year),
        ),
      ),
    { concurrency: 5 },
  )

  // and without the label or the title that is not the film's, when the
  // year of the screening confirms it
  const uniqueTitlesAndMetadata = await pMap(
    metadataWithoutSharedLabels,
    (metadata) =>
      resolveWithTitleParts(
        metadata,
        Array.from(
          metadataLookups.get(
            getMetadataLookupKey(metadata.query, metadata.year),
          )?.rawTitles ?? [],
        ),
        directorsByLookupKey.get(
          getMetadataLookupKey(metadata.query, metadata.year),
        ),
      ),
    { concurrency: 5 },
  )

  // and with the years that the screenings of the same title matched
  const uniqueTitlesAndMetadataWithSiblingHints = await resolveWithSiblingYears(
    uniqueTitlesAndMetadata,
    getMetadata,
    ({ query, year }) =>
      directorsByLookupKey.get(getMetadataLookupKey(query, year)),
  )

  return { metadataLookups, metadata: uniqueTitlesAndMetadataWithSiblingHints }
}
