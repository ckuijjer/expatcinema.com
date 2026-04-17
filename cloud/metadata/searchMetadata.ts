import leven from 'leven'

import getTmdbClient from '../clients/tmdb'
import { logger } from '../powertools'
import { getManualTitleOverride } from './manualTitleOverrides'
import { titleCase } from '../scrapers/utils/titleCase'
import {
  getTmdbSearchYears,
  mergeTmdbSearchResults,
  type TmdbMovieResult,
} from './tmdbSearchHelpers'
import {
  getMovieId,
  getTitleSearchVariants,
  normalizeMovieTitleForLookup,
  scoreCandidateWithYearHints,
  selectCandidateWithPopularityTieBreak,
} from './titleResolver'
import { Metadata, TmdbMovie } from './types'

type TmdbSearchResponse = { results: TmdbMovieResult[] }
type TmdbFindResponse = { movieResults: TmdbMovieResult[] }
type TmdbMovieAppendResponse = Omit<TmdbMovieResult, 'alternativeTitles'> & {
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
      append_to_response: 'videos,alternative_titles,external_ids',
    },
  })) as unknown as TmdbMovieAppendResponse

  const normalizedMovie = {
    ...movie,
    imdbId: movie.externalIds?.imdbId,
    alternativeTitles:
      movie.alternativeTitles?.titles
        ?.map(({ title }) => title)
        .filter((title): title is string => Boolean(title)) ?? [],
  } as TmdbMovieResult

  return normalizedMovie
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
    [tmdbMovie.title, tmdbMovie.originalTitle].sort(
      (b, a) => leven(b ?? '', title) - leven(a ?? '', title),
    )[0] ?? title,
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

  const scoredCandidates = Array.from(uniqueCandidates.values())
    .map((candidate) => ({
      candidate,
      confidence: scoreCandidateWithYearHints(title, candidate, [
        ...(year !== undefined ? [year] : []),
        ...siblingYearHints,
      ]),
    }))
    .sort((left, right) => right.confidence - left.confidence)

  const bestCandidateSelection =
    selectCandidateWithPopularityTieBreak(scoredCandidates)
  const bestCandidate = bestCandidateSelection?.winner
  const secondCandidate = scoredCandidates[1]

  logger.info('searchMetadata scored candidates', {
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
        popularity: entry.candidate.popularity,
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
        popularity: entry.candidate.popularity,
        confidence: entry.confidence,
      })),
    },
  }
}

export default searchMetadata
