import { resolveMetadata } from '../metadata/resolveMetadata'
import { Screening } from '../types'
import { combineScreenings } from './normalise'
import { resolveScreenings } from './resolve'

// The match and resolve phases on screenings that were scraped earlier, without
// scraping or publishing: for looking at what a change in the matching does on
// the same screenings, see rematch.ts
export const rematch = async (
  screenings: Screening[],
  options: { useDirectors?: boolean } = {},
) => {
  const allRawScreenings = combineScreenings({ screenings })
  const { metadataLookups, metadata } = await resolveMetadata(
    allRawScreenings,
    options,
  )

  return resolveScreenings(allRawScreenings, { metadata, metadataLookups })
}
