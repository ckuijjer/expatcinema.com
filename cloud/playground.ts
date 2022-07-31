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

const tmdbPlayground = async () => {
  const api_key = process.env.TMDB_API_KEY

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
        api_key,
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

    const addFirstSearchResult = async (query: string) => {
      const { results } = await searchMovie(query)

      if (results.length === 0) {
        return { query, correct: '❌' }
      }

      const { title, poster_path, id } = results[0]
      const image = getImageUrl(poster_path)

      return { query, title, image, id, correct: '️❓' }
    }

    const searchResult = await tmdb.get('search/movie', {
      searchParams: {
        query: 'suk suk',
      },
    })

    const searchImage = getImageUrl(searchResult.results[0].poster_path)

    const uniqueTitles = Array.from(
      new Set(screenings.map(({ title }) => title.toLowerCase())),
    ).sort()

    const uniqueTitlesAndFirstSearchResult = await pMap(
      uniqueTitles,
      addFirstSearchResult,
      {
        concurrency: 5,
      },
    )

    return {
      // screenings,
      searchResult,
      searchImage,
      uniqueTitles,
      uniqueTitlesAndFirstSearchResult,
    }
  } catch (err) {
    console.error(err)
  }
}

const playground = async ({ event, context } = {}) => {
  const results = await tmdbPlayground()
  console.log(JSON.stringify({ results }, null, 2))
}

if (require.main === module) {
  // console.log(playground({}))
  playground()
}

export default playground
