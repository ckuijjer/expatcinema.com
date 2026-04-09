import leven from 'leven'

import getTmdbClient from '../clients/tmdb'
import { logger } from '../powertools'
import { getManualTitleOverride } from './manualTitleOverrides'
import {
  getMovieId,
  getTitleSearchVariants,
  normalizeMovieTitleForLookup,
  scoreCandidate,
} from './titleResolver'
import { Metadata, TmdbMovie } from './types'

type TmdbMovieResult = TmdbMovie & {
  id: number
  [key: string]: unknown
}
type TmdbSearchResponse = { results: TmdbMovieResult[] }
type TmdbFindResponse = { movieResults: TmdbMovieResult[] }
type TmdbAlternativeTitlesResponse = {
  titles?: Array<{ title?: string }>
}

const getTmdb = () => {
  const apiKey = process.env.TMDB_API_KEY
  return getTmdbClient(apiKey)
}

const searchTmdb = async (query: string, year?: number) => {
  const tmdb = getTmdb()
  const { results } = (await tmdb.get('search/movie', {
    searchParams: {
      query,
      ...(year ? { primary_release_year: year } : {}),
    },
  })) as unknown as TmdbSearchResponse

  return results ?? []
}

const getTmdbMovie = async (tmdbId: number) => {
  const tmdb = getTmdb()
  const movie = (await tmdb.get(`movie/${tmdbId}`)) as TmdbMovieResult
  const externalIds = (await tmdb.get(`movie/${tmdbId}/external_ids`)) as {
    imdbId?: string
  }
  const alternativeTitles = (await tmdb.get(
    `movie/${tmdbId}/alternative_titles`,
  )) as TmdbAlternativeTitlesResponse

  return {
    ...movie,
    imdbId: externalIds.imdbId,
    alternativeTitles:
      alternativeTitles.titles
        ?.map(({ title }) => title)
        .filter((title): title is string => Boolean(title)) ?? [],
  }
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
  const winningTitle = [tmdbMovie.title, tmdbMovie.originalTitle].sort(
    (b, a) => leven(b ?? '', title) - leven(a ?? '', title),
  )[0]

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
    const results = await searchTmdb(query, year)
    results.slice(0, 5).forEach((result) => {
      uniqueCandidates.set(result.id, result)
    })
  }

  const scoredCandidates = Array.from(uniqueCandidates.values())
    .map((candidate) => ({
      candidate,
      confidence: scoreCandidate(title, candidate, year),
    }))
    .sort((left, right) => right.confidence - left.confidence)

  const bestCandidate = scoredCandidates[0]
  const secondCandidate = scoredCandidates[1]

  logger.info('searchMetadata scored candidates', {
    normalizedTitle,
    year,
    searchQueries,
    scoredCandidates: scoredCandidates.slice(0, 5).map((entry) => ({
      tmdbId: entry.candidate.id,
      title: entry.candidate.title,
      originalTitle: entry.candidate.originalTitle,
      releaseDate: entry.candidate.releaseDate,
      confidence: entry.confidence,
    })),
  })

  if (
    bestCandidate &&
    bestCandidate.confidence >= 0.9 &&
    (!secondCandidate ||
      bestCandidate.confidence - secondCandidate.confidence >= 0.05)
  ) {
    const tmdbMovie = await getTmdbMovie(bestCandidate.candidate.id)
    return buildResolvedMetadata(title, tmdbMovie, {
      status: 'matched',
      method: 'tmdb-search',
      confidence: bestCandidate.confidence,
      matchedTitle: tmdbMovie.title,
      matchedOriginalTitle: tmdbMovie.originalTitle,
      matchedReleaseDate: tmdbMovie.releaseDate,
      matchedAlternativeTitle: tmdbMovie.alternativeTitles?.find(
        (alternativeTitle) =>
          normalizeMovieTitleForLookup(alternativeTitle) === normalizedTitle,
      ),
      candidates: scoredCandidates.slice(0, 3).map((entry) => ({
        movieId: getMovieId(entry.candidate.id),
        tmdbId: entry.candidate.id,
        title: entry.candidate.title,
        originalTitle: entry.candidate.originalTitle,
        releaseDate: entry.candidate.releaseDate,
        confidence: entry.confidence,
      })),
    })
  }

  return {
    match: {
      status:
        bestCandidate && bestCandidate.confidence >= 0.75
          ? 'ambiguous'
          : 'unmatched',
      method: 'unmatched',
      confidence: bestCandidate?.confidence,
      candidates: scoredCandidates.slice(0, 3).map((entry) => ({
        movieId: getMovieId(entry.candidate.id),
        tmdbId: entry.candidate.id,
        title: entry.candidate.title,
        originalTitle: entry.candidate.originalTitle,
        releaseDate: entry.candidate.releaseDate,
        confidence: entry.confidence,
      })),
    },
  }
}

export default searchMetadata
