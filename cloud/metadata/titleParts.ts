import getMetadata from './index'
import { DELIMITER } from './sharedLabels'
import { compactTitle } from './titleResolver'
import { Metadata } from './types'

const YEAR_TOLERANCE = 1

// "Cine Kilo: Blade", "Böse Spiele - Rimini Sparta": one part of a title with
// a delimiter is the film, the other is a label, but which one is a guess.
// So a part only counts when it is the title of a film that was released in
// the year of the screening (not just the start of a longer title, such as
// "National Theatre Live" for "National Theatre Live: Fleabag"), and when the
// parts don't point to different films.
export const resolveWithTitleParts = async (
  metadata: Metadata,
  rawTitles: string[],
): Promise<Metadata> => {
  if (
    metadata.year === undefined ||
    metadata.match.status === 'matched' ||
    metadata.match.status === 'manual'
  ) {
    return metadata
  }

  const parts = Array.from(
    new Set(
      rawTitles
        .flatMap((rawTitle) => rawTitle.split(DELIMITER))
        .map((part) => part.trim())
        .filter((part) => part.length >= 3),
    ),
  )

  if (parts.length < 2) {
    return metadata
  }

  const confirmed: { part: string; retry: Metadata }[] = []

  for (const part of parts) {
    const retry = await getMetadata({ title: part, year: metadata.year })
    const releaseYear = Number(retry.tmdb?.releaseDate?.slice(0, 4))

    const isTitleOfFilm = [
      retry.title,
      retry.originalTitle,
      retry.tmdb?.title,
    ].some((title) => title && compactTitle(title) === compactTitle(part))

    if (
      retry.match.status === 'matched' &&
      isTitleOfFilm &&
      Math.abs(releaseYear - metadata.year) <= YEAR_TOLERANCE
    ) {
      confirmed.push({ part, retry })
    }
  }

  const films = new Set(confirmed.map(({ retry }) => retry.movieId))

  if (films.size !== 1) {
    return metadata
  }

  const { part, retry } = confirmed[0]

  return {
    ...retry,
    query: metadata.query,
    year: metadata.year,
    match: { ...retry.match, method: 'title-part', strippedTitle: part },
  }
}
