import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda'

import { DateTime, Info, Settings } from 'luxon'
import { inspect } from 'util'
import ketelhuis from './scrapers/ketelhuis'
import got from 'got'
import { publicIp, publicIpv4, publicIpv6 } from 'public-ip'
// import chromium from 'chrome-aws-lambda'
// const chromium = require('chrome-aws-lambda')
import chromium from '@sparticuz/chrome-aws-lambda'
import pMap from 'p-map'

import puppeteer from 'puppeteer'
import { Screening } from 'types'

// const documentClient = require('./documentClient')

Settings.defaultZone = 'Europe/Amsterdam'

const timezonePlayground = async ({ event, context } = {}) => {
  const timestamp = '2019-01-09 11:23'
  const format = 'yyyy-MM-dd HH:mm'

  const amsterdamFromFormatWithZone = DateTime.fromFormat(timestamp, format, {
    zone: 'Europe/Amsterdam',
  })
    .toUTC()
    .toISO()

  const utcTime = DateTime.fromFormat(timestamp, format).toUTC().toISO()

  const utcTimeWithZone = DateTime.fromFormat(timestamp, format, {
    zone: 'UTC',
  })
    .toUTC()
    .toISO()

  const result = {
    // features,
    amsterdamFromFormatWithZone,
    utcTime,
    utcTimeWithZone,
  }

  console.log(result)
  return result
}

const getUsingChromium = async (url: string) => {
  let result = null
  let browser = null

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    let page = await browser.newPage()

    await page.goto(url)

    return await page.content()
  } catch (error) {
    throw error
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
}

const movieMetadataPlayground = async () => {
  const tmdbApiKey = process.env.TMDB_API_KEY
  const omdbApiKey = process.env.OMDB_API_KEY
  const googleCustomSearchApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const googleCustomSearchId = process.env.GOOGLE_CUSTOM_SEARCH_ID

  try {
    const screenings: Screening[] = await got
      .get(
        `https://s3-eu-west-1.amazonaws.com/${process.env.PUBLIC_BUCKET}/screenings.json`,
      )
      .json()

    const tmdb = got.extend({
      prefixUrl: 'https://api.themoviedb.org/3',
      responseType: 'json', // to have json parsing
      resolveBodyOnly: true, // to have the response only contain the body, not the entire response, got internal things etc
      searchParams: {
        api_key: tmdbApiKey,
      },
    })

    const configuration = await tmdb.get('configuration')

    const imageBaseUrl = configuration.images.secure_base_url
    const posterWidth = configuration.images.poster_sizes[2] // w185 (could make this dynamic)

    const getImageUrl = (imagePath: string) =>
      [imageBaseUrl, posterWidth, imagePath].join('')

    const searchMovie = async (query: string) =>
      tmdb.get('search/movie', {
        searchParams: {
          query,
        },
      })

    const getExternalIds = async (id: number) =>
      tmdb.get(`movie/${id}/external_ids`)

    const getFirstTMDBSearchResult = async (query: string) => {
      const { results } = await searchMovie(query)

      if (results.length === 0) {
        return { correct: '❌' }
      }

      const {
        title,
        poster_path,
        id: tmdbId,
        original_title: originalTitle,
      } = results[0]
      const image = getImageUrl(poster_path)

      const { imdb_id: imdbId } = await getExternalIds(tmdbId)

      return { title, originalTitle, image, tmdbId, imdbId, correct: '️❓' }
    }

    const getDuckDuckGoInfoBoxResult = async (query: string) => {
      const result: any = await got.get('https://api.duckduckgo.com', {
        searchParams: {
          q: query,
          format: 'json',
          t: 'expatcinema.com',
        },
        responseType: 'json', // to have json parsing
        resolveBodyOnly: true, // to have the response only contain the body, not the entire response, got internal things etc
      })

      if (result.Entity === 'film') {
        return {
          title: result.Heading,
          imdbId: result.Infobox.content.find(
            ({ data_type }) => data_type === 'imdb_id',
          )?.value,
          rottenTomatoesId: result.Infobox.content.find(
            ({ data_type }) => data_type === 'rotten_tomatoes',
          )?.value,
          correct: '️❓',
        }
      } else {
        return { correct: '❌' }
      }

      return result
    }

    const getFirstOMDBSearchResult = async (query: string) => {
      const result = await got.get('https://www.omdbapi.com', {
        searchParams: {
          apikey: omdbApiKey,
          t: query,
          type: 'movie',
        },
        responseType: 'json', // to have json parsing
        resolveBodyOnly: true, // to have the response only contain the body, not the entire response, got internal things etc
      })

      if (result) {
        return {
          title: result.Title,
          imdbId: result.imdbID,
          correct: '️❓',
        }
      } else {
        return { correct: '❌' }
      }
    }

    const getGoogleCustomSearchResult = async (query: string) => {
      const result = await got.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          searchParams: {
            q: query,
            cx: googleCustomSearchId,
            key: googleCustomSearchApiKey,
          },
          responseType: 'json', // to have json parsing
          resolveBodyOnly: true, // to have the response only contain the body, not the entire response, got internal things etc
        },
      )

      if (result.items?.length > 0) {
        return {
          title: result.items[0].title.replace(/ \(\d{4}\) - IMDb/, ''),
          imdbId: result.items[0].pagemap.metatags[0]['imdb:pageconst'],
          correct: '️❓',
        }
      } else {
        return { correct: '❌' }
      }
    }

    const addMetadata = async (query: string) => {
      const tmdb = await getFirstTMDBSearchResult(query)
      const duckduckgo = await getDuckDuckGoInfoBoxResult(query)
      const omdb = await getFirstOMDBSearchResult(query)
      const google = await getGoogleCustomSearchResult(query)

      return { query, tmdb, duckduckgo, omdb, google }
    }

    const uniqueTitles = Array.from(
      new Set(screenings.map(({ title }) => title.toLowerCase())),
    ).sort()

    const uniqueTitlesAndMetadata = await pMap(uniqueTitles, addMetadata, {
      concurrency: 5,
    })

    return {
      // screenings,
      // searchResult,
      // searchImage,
      uniqueTitles,
      uniqueTitlesAndMetadata,
    }
  } catch (err) {
    console.error(err)
  }
}

const playground = async ({ event, context } = {}) => {
  const results = await movieMetadataPlayground()
  console.log(JSON.stringify({ results }, null, 2))
}

if (require.main === module) {
  playground()
}

export default playground
