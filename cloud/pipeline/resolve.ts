import { buildMovies, makeSlugsUnique } from '../metadata/buildMovies'
import type { MetadataLookups } from '../metadata/resolveMetadata'
import { getMetadataLookupKey } from '../metadata/titleResolver'
import type { Metadata } from '../metadata/types'
import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { logger } from '../powertools'
import { Screening } from '../types'

// What the public screenings.json has: the movie a screening was matched to,
// and not the director, which is only used for the matching
export type ResolvedScreening = Omit<Screening, 'director'> & {
  movieId?: string
}

// Phase: resolve. Joins the screenings with what they were matched to, and
// builds what is published from the lookups: the screenings with their movieId,
// the movies, the record of every lookup, and the lists to review.
export const resolveScreenings = (
  screenings: Screening[],
  {
    metadata,
    metadataLookups,
  }: { metadata: Metadata[]; metadataLookups: MetadataLookups },
) => {
  const metadataByLookupKey = new Map(
    metadata.map((entry) => [
      getMetadataLookupKey(entry.query, entry.year),
      entry,
    ]),
  )

  const resolvedScreenings: ResolvedScreening[] = makeScreeningsUniqueAndSorted(
    screenings.map((screening) => {
      const matched = metadataByLookupKey.get(
        getMetadataLookupKey(screening.title, screening.year),
      )

      // The director is only used while scraping, it isn't needed in the
      // public screenings.json
      const { director, ...withoutDirector } = screening

      return {
        ...withoutDirector,
        movieId: matched?.movieId,
      }
    }),
  )

  const { movies, clashes } = makeSlugsUnique(buildMovies(metadata))

  clashes.forEach(({ slug, movies }) => {
    // usually a cinema with a wrong year, that got a screening matched to
    // another movie than the other cinemas
    logger.warn('movies share a slug', { slug, movies })
  })

  const toTitleMatchRecord = (entry: Metadata) => {
    const rawTitles = Array.from(
      metadataLookups.get(getMetadataLookupKey(entry.query, entry.year))
        ?.rawTitles ?? [],
    )

    return {
      query: entry.query,
      year: entry.year,
      titleRaw: rawTitles[0],
      titleRawVariants: rawTitles,
      movieId: entry.movieId,
      title: entry.title,
      originalTitle: entry.originalTitle,
      imdbId: entry.imdbId,
      tmdbId: entry.tmdb?.id,
      match: entry.match,
    }
  }

  return {
    screenings: resolvedScreenings,
    movies,
    titleMatches: metadata.map(toTitleMatchRecord),
    review: {
      ambiguous: metadata
        .filter((entry) => entry.match.status === 'ambiguous')
        .map(toTitleMatchRecord),
      unmatched: metadata
        .filter((entry) => entry.match.status === 'unmatched')
        .map(toTitleMatchRecord),
      // matched, but the director of the screenings isn't one of the film's
      directorDisagreements: metadata
        .filter(
          (entry) =>
            entry.match.status === 'matched' &&
            entry.match.directorMatch === 'disagree',
        )
        .map(toTitleMatchRecord),
    },
  }
}
