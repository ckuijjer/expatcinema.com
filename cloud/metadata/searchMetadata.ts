import leven from 'leven'
import diacritics from 'diacritics'
import { logger } from '../powertools'

import getTmdbClient from '../clients/tmdb'
import getOmdbClient from '../clients/omdb'
import getDuckDuckGoClient from '../clients/duckduckgo'
import getGoogleCustomSearchClient from '../clients/google-customsearch'

const getFirstTmdbSearchResult = async (title: string) => {
  const apiKey = process.env.TMDB_API_KEY

  const tmdb = getTmdbClient(apiKey)

  const { results }: any = await tmdb.get('search/movie', {
    searchParams: {
      query: title,
    },
  })

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

  const { movieResults }: any = await tmdb.get(`find/${imdbId}`, {
    searchParams: {
      external_source: 'imdb_id',
    },
  })

  const movie = movieResults?.[0]
  return movie
}

const getFirstOmdbSearchResult = async (title: string) => {
  const apiKey = process.env.OMDB_API_KEY

  const omdb = getOmdbClient(apiKey)

  const result = await omdb.get({
    searchParams: { t: title, type: 'movie' },
  })

  return result
}

const getFirstDuckDuckGoResult = async (title: string) => {
  const duckDuckGo = getDuckDuckGoClient()

  const result: any = await duckDuckGo.get({
    searchParams: {
      q: title,
    },
  })

  if (result.entity === 'film') {
    return {
      title: result.heading,
      imdbId: result.infobox.content.find(
        ({ dataType }) => dataType === 'imdb_id',
      )?.value,
    }
  }
}

const getFirstGoogleCustomSearchResult = async (title: string) => {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const customSearchId = process.env.GOOGLE_CUSTOM_SEARCH_ID

  const googleCustomSearch = getGoogleCustomSearchClient({
    customSearchId,
    apiKey,
  })

  const result: any = await googleCustomSearch.get({
    searchParams: {
      q: title,
    },
  })

  if (result.items?.length > 0) {
    return {
      title: result.items[0].title.replace(/ \(\d{4}\) - IMDb/, ''),
      imdbId: result.items[0].pagemap.metatags[0]['imdb:pageconst'],
    }
  }
}

const searchMetadata = async (title: string) => {
  const normalizedTitle = diacritics.remove(title.toLowerCase())

  const tmdb = await getFirstTmdbSearchResult(normalizedTitle)
  // const omdb = await getFirstOmdbSearchResult(normalizedTitle)  // OMDB throws 500 errors
  const duckduckgo = await getFirstDuckDuckGoResult(normalizedTitle)
  const googleCustomSearch =
    await getFirstGoogleCustomSearchResult(normalizedTitle)

  const firstSearchResults = Object.entries({
    tmdb,
    // omdb, // OMDB throws 500 errors
    duckduckgo,
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
