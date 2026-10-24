import getTmdbClient from '../clients/tmdb'
import { logger } from '../powertools'
import { compareDirectors, parseDirectorNames } from './directors'
import { getManualTitleOverride } from './manualTitleOverrides'
import { titleCase } from '../scrapers/utils/titleCase'
import {
  getTmdbSearchYears,
  mergeTmdbSearchResults,
  type TmdbMovieResult,
} from './tmdbSearchHelpers'
import {
  getMovieId,
  candidateYearAgrees,
  getTitleSearchVariants,
  pickDisplayTitle,
  normalizeMovieTitleForLookup,
  scoreCandidateWithYearHints,
  selectCandidateWithPopularityTieBreak,
} from './titleResolver'
import { DirectorMatch, Metadata, TmdbMovie } from './types'

type TmdbSearchResponse = { results: TmdbMovieResult[] }
type TmdbFindResponse = { movieResults: TmdbMovieResult[] }
type TmdbMovieAppendResponse = Omit<TmdbMovieResult, 'alternativeTitles'> & {
  genres?: Array<{ id: number; name?: string }>
  credits?: {
    crew?: Array<{ job?: string; name?: string }>
  }
  alternativeTitles?: {
    titles?: Array<{ title?: string }>
  }
  externalIds?: {
    imdbId?: string
  }
}

const getTmdb = () => {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is required')
  }
  return getTmdbClient(apiKey)
}

const searchTmdb = async (query: string, year?: number) => {
  const tmdb = getTmdb()
  const { results } = (await tmdb.get('search/movie', {
    searchParams: {
      query,
      ...(year !== undefined ? { primary_release_year: year } : {}),
    },
  })) as unknown as TmdbSearchResponse

  return results ?? []
}

const searchTmdbCandidates = async (
  query: string,
  year?: number,
  siblingYearHints: number[] = [],
) => {
  const searchYears = getTmdbSearchYears(year, siblingYearHints)
  const resultSets = await Promise.all(
    searchYears.map((searchYear) => searchTmdb(query, searchYear)),
  )

  return mergeTmdbSearchResults(resultSets)
}

const getTmdbMovie = async (tmdbId: number) => {
  const tmdb = getTmdb()
  const movie = (await tmdb.get(`movie/${tmdbId}`, {
    searchParams: {
      append_to_response: 'videos,alternative_titles,external_ids,credits',
    },
  })) as unknown as TmdbMovieAppendResponse

  const directors = (movie.credits?.crew ?? [])
    .filter((member) => member.job === 'Director')
    .map((member) => member.name)
    .filter((name): name is string => Boolean(name))

  const normalizedMovie = {
    ...movie,
    genres: (movie.genres ?? [])
      .map((g) => g.name)
      .filter((name): name is string => Boolean(name)),
    directors,
    imdbId: movie.externalIds?.imdbId,
    alternativeTitles:
      movie.alternativeTitles?.titles
        ?.map(({ title }) => title)
        .filter((title): title is string => Boolean(title)) ?? [],
  } as TmdbMovieResult

  return normalizedMovie
}

// A candidate with a director that is one of the cinemas' is more likely the
// film. Worth as much as a year that agrees is, so that a film with the right
// title but the wrong or no year still gets over the threshold, and wins from
// another film with that title. A director that isn't one of the film's counts
// for nothing: cinemas and TMDB write names differently, and a film has more
// people to be credited as director than TMDB knows.
const DIRECTOR_AGREES_BONUS = 0.1

// Only the best candidates are looked at, each takes a request. The others
// can't win: they are all worse than these.
const DIRECTOR_CANDIDATES = 8

const directorsCache = new Map<number, Promise<string[]>>()

const getTmdbDirectors = (tmdbId: number) => {
  if (!directorsCache.has(tmdbId)) {
    directorsCache.set(
      tmdbId,
      getTmdb()
        .get(`movie/${tmdbId}/credits`)
        .then((credits) =>
          (
            (
              credits as unknown as {
                crew?: Array<{ job?: string; name?: string }>
              }
            ).crew ?? []
          )
            .filter((member) => member.job === 'Director')
            .map((member) => member.name)
            .filter((name): name is string => Boolean(name)),
        ),
    )
  }

  return directorsCache.get(tmdbId) as Promise<string[]>
}

type DirectorEvidence = { directorMatch?: DirectorMatch }

const withDirectorEvidence = async <
  T extends { candidate: TmdbMovieResult; confidence: number },
>(
  scoredCandidates: T[],
  directors: string[],
): Promise<Array<T & DirectorEvidence & { directorAgrees: boolean }>> => {
  const evidence = await Promise.all(
    scoredCandidates.slice(0, DIRECTOR_CANDIDATES).map(async (entry) => {
      const directorMatch = compareDirectors(
        directors,
        await getTmdbDirectors(entry.candidate.id),
      )

      return {
        ...entry,
        directorMatch,
        directorAgrees: directorMatch === 'agree',
        // not capped at 1, a film with the right director goes before another
        // with the same title and year
        confidence:
          entry.confidence +
          (directorMatch === 'agree' ? DIRECTOR_AGREES_BONUS : 0),
      }
    }),
  )

  return evidence.sort((left, right) => right.confidence - left.confidence)
}

// The title of a film isn't always the same at a cinema as at TMDB (a
// translated or local title), so there is no candidate to give a director to.
// The director's own films are searched instead.
const DIRECTOR_FILMOGRAPHY_THRESHOLD = 0.7

// A title that is too different for that, "Cult Night > Rocky Horror" for "The
// Rocky Horror Picture Show", still is the film if it is the only film of the
// director released around the year of the screening and has a word of the
// title in common
const COMMON_WORDS = new Set(['film', 'films', 'cinema', 'live', 'night'])

const significantWords = (title: string) =>
  normalizeMovieTitleForLookup(title)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !COMMON_WORDS.has(word))

const sharesWordWithTitle = (title: string, candidate: TmdbMovieResult) => {
  const words = new Set(significantWords(title))

  return [candidate.title, candidate.originalTitle].some((candidateTitle) =>
    significantWords(candidateTitle ?? '').some((word) => words.has(word)),
  )
}

type TmdbPerson = { id: number; name?: string; knownForDepartment?: string }

const personFilmographyCache = new Map<string, Promise<TmdbMovieResult[]>>()

const getDirectorFilmography = (name: string) => {
  if (!personFilmographyCache.has(name)) {
    personFilmographyCache.set(
      name,
      (async () => {
        const tmdb = getTmdb()
        const { results } = (await tmdb.get('search/person', {
          searchParams: { query: name },
        })) as unknown as { results?: TmdbPerson[] }

        const person = (results ?? []).find(
          (result) =>
            result.knownForDepartment === 'Directing' &&
            compareDirectors([name], [result.name ?? '']) === 'agree',
        )

        if (!person) return []

        const credits = (await tmdb.get(
          `person/${person.id}/movie_credits`,
        )) as unknown as {
          crew?: Array<TmdbMovieResult & { job?: string }>
        }

        return (credits.crew ?? []).filter((movie) => movie.job === 'Director')
      })(),
    )
  }

  return personFilmographyCache.get(name) as Promise<TmdbMovieResult[]>
}

const searchDirectorFilmographies = async (
  title: string,
  yearHints: number[],
  directors: string[],
) => {
  const names = parseDirectorNames(directors).slice(0, 3)
  const films = new Map<number, TmdbMovieResult>()

  for (const name of names) {
    for (const film of await getDirectorFilmography(name)) {
      films.set(film.id, film)
    }
  }

  return Array.from(films.values())
    .map((candidate) => ({
      candidate,
      confidence: scoreCandidateWithYearHints(title, candidate, yearHints),
      yearAgrees: candidateYearAgrees(title, candidate, yearHints),
    }))
    .sort((left, right) => right.confidence - left.confidence)
}

const getTmdbUsingImdbId = async (imdbId: string) => {
  const tmdb = getTmdb()
  const { movieResults } = (await tmdb.get(`find/${imdbId}`, {
    searchParams: {
      external_source: 'imdb_id',
    },
  })) as unknown as TmdbFindResponse

  const movie = movieResults?.[0]
  return movie
}

const buildResolvedMetadata = (
  title: string,
  tmdbMovie: TmdbMovieResult,
  match: Metadata['match'],
): Omit<Metadata, 'query' | 'createdAt'> => {
  const winningTitle = titleCase(
    pickDisplayTitle(title, tmdbMovie.title, tmdbMovie.originalTitle),
  )

  return {
    movieId: getMovieId(tmdbMovie.id),
    imdbId: tmdbMovie.imdbId,
    title: winningTitle,
    originalTitle: tmdbMovie.originalTitle,
    tmdb: tmdbMovie,
    match,
  }
}

const searchMetadata = async (
  title: string,
  year?: number,
  siblingYearHints: number[] = [],
  directors: string[] = [],
): Promise<Omit<Metadata, 'query' | 'createdAt'>> => {
  const normalizedTitle = normalizeMovieTitleForLookup(title)
  const manualOverride = getManualTitleOverride(title, year)

  if (manualOverride?.tmdbId) {
    const tmdbMovie = await getTmdbMovie(manualOverride.tmdbId)
    return buildResolvedMetadata(title, tmdbMovie, {
      status: 'manual',
      method: 'manual-override',
      confidence: 1,
      matchedTitle: tmdbMovie.title,
      matchedOriginalTitle: tmdbMovie.originalTitle,
      matchedReleaseDate: tmdbMovie.releaseDate,
    })
  }

  if (manualOverride?.imdbId) {
    const tmdbResult = await getTmdbUsingImdbId(manualOverride.imdbId)
    if (tmdbResult?.id) {
      const tmdbMovie = await getTmdbMovie(tmdbResult.id)
      return buildResolvedMetadata(title, tmdbMovie, {
        status: 'manual',
        method: 'manual-override',
        confidence: 1,
        matchedTitle: tmdbMovie.title,
        matchedOriginalTitle: tmdbMovie.originalTitle,
        matchedReleaseDate: tmdbMovie.releaseDate,
      })
    }
  }

  const searchQueries = getTitleSearchVariants(title)
  const uniqueCandidates = new Map<number, TmdbMovieResult>()

  for (const query of searchQueries) {
    const results = await searchTmdbCandidates(query, year, siblingYearHints)
    results.forEach((result) => {
      uniqueCandidates.set(result.id, result)
    })
  }

  const yearHints = [...(year !== undefined ? [year] : []), ...siblingYearHints]

  const scoredByTitleAndYear = Array.from(uniqueCandidates.values())
    .map((candidate) => ({
      candidate,
      confidence: scoreCandidateWithYearHints(title, candidate, yearHints),
      yearAgrees: candidateYearAgrees(title, candidate, yearHints),
    }))
    .sort((left, right) => right.confidence - left.confidence)

  const hasDirectors = parseDirectorNames(directors).length > 0

  const scoredCandidates: Array<
    (typeof scoredByTitleAndYear)[number] & {
      directorMatch?: DirectorMatch
      directorAgrees?: boolean
    }
  > = hasDirectors
    ? await withDirectorEvidence(scoredByTitleAndYear, directors)
    : scoredByTitleAndYear

  const candidateSummaries = () =>
    scoredCandidates.slice(0, 3).map((entry) => ({
      movieId: getMovieId(entry.candidate.id),
      tmdbId: entry.candidate.id,
      title: entry.candidate.title,
      originalTitle: entry.candidate.originalTitle,
      releaseDate: entry.candidate.releaseDate,
      popularity: entry.candidate.popularity,
      confidence: Math.min(1, entry.confidence),
      ...(entry.directorMatch ? { directorMatch: entry.directorMatch } : {}),
    }))

  const bestCandidateSelection =
    selectCandidateWithPopularityTieBreak(scoredCandidates)
  const bestCandidate = bestCandidateSelection?.winner
  const secondCandidate = scoredCandidates[1]

  logger.debug('searchMetadata scored candidates', {
    normalizedTitle,
    year,
    siblingYearHints,
    searchYears: getTmdbSearchYears(year, siblingYearHints),
    searchQueries,
    scoredCandidates: scoredCandidates.slice(0, 5).map((entry) => ({
      tmdbId: entry.candidate.id,
      title: entry.candidate.title,
      originalTitle: entry.candidate.originalTitle,
      releaseDate: entry.candidate.releaseDate,
      popularity: entry.candidate.popularity,
      confidence: entry.confidence,
    })),
  })

  if (
    bestCandidate &&
    bestCandidate.confidence >= 0.9 &&
    (bestCandidateSelection?.hasPopularityTieBreak ||
      !secondCandidate ||
      bestCandidate.confidence - secondCandidate.confidence >= 0.05)
  ) {
    const tmdbMovie = await getTmdbMovie(bestCandidate.candidate.id)
    return buildResolvedMetadata(title, tmdbMovie, {
      status: 'matched',
      method: 'tmdb-search',
      confidence: Math.min(1, bestCandidate.confidence),
      matchedTitle: tmdbMovie.title,
      matchedOriginalTitle: tmdbMovie.originalTitle,
      matchedReleaseDate: tmdbMovie.releaseDate,
      popularityTieBreak: bestCandidateSelection?.hasPopularityTieBreak,
      matchedAlternativeTitle: tmdbMovie.alternativeTitles?.find(
        (alternativeTitle) =>
          normalizeMovieTitleForLookup(alternativeTitle) === normalizedTitle,
      ),
      ...(hasDirectors
        ? {
            directorMatch: scoredCandidates.find(
              ({ candidate }) => candidate.id === bestCandidate.candidate.id,
            )?.directorMatch,
          }
        : {}),
      candidates: candidateSummaries(),
    })
  }

  // No film with this title is the one, but a film of the director with a
  // title that comes close, released around the year, is
  if (hasDirectors) {
    const filmography = await searchDirectorFilmographies(
      title,
      yearHints,
      directors,
    )
    const [best, second] = filmography
    const releasedAroundTheYear = filmography.filter(
      ({ candidate, yearAgrees }) =>
        yearAgrees && sharesWordWithTitle(title, candidate),
    )

    const byTitle =
      best &&
      best.confidence >= DIRECTOR_FILMOGRAPHY_THRESHOLD &&
      (!second || best.confidence - second.confidence >= 0.05)
    const byYear = !byTitle && releasedAroundTheYear.length === 1

    const winner = byTitle
      ? best
      : byYear
        ? releasedAroundTheYear[0]
        : undefined

    if (winner) {
      const tmdbMovie = await getTmdbMovie(winner.candidate.id)
      return buildResolvedMetadata(title, tmdbMovie, {
        status: 'matched',
        method: byTitle ? 'director' : 'director-year',
        confidence: winner.confidence,
        matchedTitle: tmdbMovie.title,
        matchedOriginalTitle: tmdbMovie.originalTitle,
        matchedReleaseDate: tmdbMovie.releaseDate,
        directorMatch: 'agree',
        candidates: candidateSummaries(),
      })
    }
  }

  return {
    match: {
      status:
        bestCandidate && bestCandidate.confidence >= 0.75
          ? 'ambiguous'
          : 'unmatched',
      method: 'unmatched',
      confidence: bestCandidate?.confidence,
      candidates: candidateSummaries(),
    },
  }
}

export default searchMetadata
