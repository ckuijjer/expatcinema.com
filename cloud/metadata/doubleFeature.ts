import getMetadata from './index'
import { isTitleOfFilm } from './titleParts'
import { Metadata } from './types'

// "Man of Marble / Man of Iron": two films shown after one another for one
// ticket. The title is the titles of both, so TMDB doesn't know it.
const SEPARATOR = /\s+\/\s+/

// "5 Centimeters Per Second (2007) / the Garden of Words (2013)": each film
// can come with its year
const TRAILING_YEAR = /\s*\((?:19|20)\d{2}\)$/

// A title of exactly two parts, which are each the title of a film, and not the
// same one ("Hoe lang nog / How much longer" is one film in two languages). A
// year isn't used: it is the year of one of the films, or none.
export const resolveWithDoubleFeature = async (
  metadata: Metadata,
  rawTitles: string[],
): Promise<{ metadata: Metadata; parts: Metadata[] }> => {
  if (
    metadata.match.status === 'matched' ||
    metadata.match.status === 'manual'
  ) {
    return { metadata, parts: [] }
  }

  const titleParts = rawTitles
    .map((rawTitle) =>
      rawTitle
        .split(SEPARATOR)
        .map((part) => part.replace(TRAILING_YEAR, '').trim()),
    )
    .find(
      (parts) => parts.length === 2 && parts.every((part) => part.length >= 3),
    )

  if (!titleParts) {
    return { metadata, parts: [] }
  }

  const parts = await Promise.all(
    titleParts.map((part) => getMetadata({ title: part })),
  )

  const isDoubleFeature =
    parts.every(
      (part, index) =>
        part.match.status === 'matched' &&
        isTitleOfFilm(part, titleParts[index]),
    ) && new Set(parts.map(({ movieId }) => movieId)).size === parts.length

  if (!isDoubleFeature) {
    return { metadata, parts: [] }
  }

  return {
    metadata: {
      ...parts[0],
      query: metadata.query,
      year: metadata.year,
      match: {
        ...parts[0].match,
        method: 'double-feature',
        doubleFeature: parts.map(({ movieId }) => movieId as string),
      },
    },
    parts,
  }
}
