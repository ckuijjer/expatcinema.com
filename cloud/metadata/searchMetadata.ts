import leven from 'leven'

import getGoogleCustomSearchClient from '../clients/google-customsearch'
import getTmdbClient from '../clients/tmdb'
import { logger } from '../powertools'
import { removeDiacritics } from '../scrapers/utils/removeDiacritics'

type TmdbMovieResult = { id: number; title?: string; originalTitle?: string; [key: string]: unknown }
type TmdbSearchResponse = { results: TmdbMovieResult[] }
type TmdbFindResponse = { movieResults: TmdbMovieResult[] }
type GoogleSearchItem = { title: string; pagemap: { metatags: Array<Record<string, string>> } }
type GoogleSearchResponse = { items?: GoogleSearchItem[] }

const getFirstTmdbSearchResult = async (title: string) => {
  const apiKey = process.env.TMDB_API_KEY

  const tmdb = getTmdbClient(apiKey)

  const { results } = (await tmdb.get('search/movie', {
    searchParams: {
      query: title,
    },
  })) as TmdbSearchResponse

  if (results?.length > 0) {
    return {
      ...results[0],
      ...(await tmdb.get(`movie/${results[0]?.id}/external_ids`)),
    }
  }
}

const getTmdbUsingImdbId = async (imdbId: string) => {
  const apiKey = process.env.TMDB_API_KEY

  const tmdb = getTmdbClient(apiKey)

  const { movieResults } = (await tmdb.get(`find/${imdbId}`, {
    searchParams: {
      external_source: 'imdb_id',
    },
  })) as TmdbFindResponse

  const movie = movieResults?.[0]
  return movie
}

const getFirstGoogleCustomSearchResult = async (title: string) => {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const customSearchId = process.env.GOOGLE_CUSTOM_SEARCH_ID

  const googleCustomSearch = getGoogleCustomSearchClient({
    customSearchId,
    apiKey,
  })

  const result = (await googleCustomSearch.get({
    searchParams: {
      q: title,
    },
  })) as GoogleSearchResponse

  if (result.items?.length > 0) {
    return {
      title: result.items[0].title.replace(/ \(\d{4}\) - IMDb/, ''),
      imdbId: result.items[0].pagemap.metatags[0]['imdb:pageconst'],
    }
  }
}

const searchMetadata = async (title: string) => {
  const normalizedTitle = removeDiacritics(title.toLowerCase())

  const tmdb = await getFirstTmdbSearchResult(normalizedTitle)
  const googleCustomSearch =
    await getFirstGoogleCustomSearchResult(normalizedTitle)

  const firstSearchResults = Object.entries({
    tmdb,
    googleCustomSearch,
  }).map(([name, value]) => ({ name, imdbId: value?.imdbId ?? null }))

  // determine the winning imdbId
  const imdbIds = firstSearchResults
    .map(({ imdbId }) => imdbId)
    .filter((x) => x)

  const winningImdbId = imdbIds.sort(
    (a, b) =>
      imdbIds.filter((id) => id === b).length -
      imdbIds.filter((id) => id === a).length,
  )[0]

  logger.info('searchMetadata results', {
    normalizedTitle,
    firstSearchResults,
    winningImdbId,
  })

  // search tmdb for the imdbId
  const tmdbResult = await getTmdbUsingImdbId(winningImdbId)
  if (tmdbResult) {
    const winningTitle = [tmdbResult.title, tmdbResult.originalTitle].sort(
      (b, a) => leven(b, title) - leven(a, title),
    )[0]

    logger.info('searchMetadata tmdb result', {
      normalizedTitle,
      winningImdbId,
      tmdbResult,
      winningTitle,
    })

    return {
      imdbId: winningImdbId,
      title: winningTitle,
      tmdb: tmdbResult,
    }
  } else {
    logger.warn('searchMetadata no tmdb result', {
      normalizedTitle,
      winningImdbId,
    })
  }
}

export default searchMetadata
