import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda'

import { DateTime, Info, Settings } from 'luxon'
import { inspect } from 'util'
import ketelhuis from './scrapers/ketelhuis'
import got from 'got'
import { publicIp, publicIpv4, publicIpv6 } from 'public-ip'
// import chromium from 'chrome-aws-lambda'
// const chromium = require('chrome-aws-lambda')
import chromium from '@sparticuz/chromium'
import pMap from 'p-map'
import diacritics from 'diacritics'

import puppeteer from 'puppeteer-core'
import { Screening } from 'types'

import getTmdbClient from './clients/tmdb'
import getOmdbClient from './clients/omdb'
import getDuckDuckGoClient from './clients/duckduckgo'
import getGoogleCustomSearchClient from './clients/google-customsearch'

import { getBrowser } from './browser'
import { logger as parentLogger } from 'powertools'

import getMetadata from './metadata'
import middy from '@middy/core'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'playground',
  },
})

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

const getUsingChromium = async () => {
  const browser = await getBrowser({ logger })

  let page = await browser.newPage()

  page.waitForResponse((response) => {
    logger.info('waitForResponse', { response })
  })

  await page.goto('https://cineramabios.nl/?main_section=films')

  await page.waitForSelector('body')
  const textContent = await page.evaluate(
    () => document.querySelector('body').textContent,
  )

  logger.info('Page title' + textContent)
}

const movieMetadataPlayground = async () => {
  try {
    const screenings: Screening[] = await got
      .get(
        `https://s3-eu-west-1.amazonaws.com/expatcinema-public-prod/screenings.json`,
      )
      .json()

    const uniqueTitles = Array.from(
      new Set(
        screenings.map(({ title }) => diacritics.remove(title.toLowerCase())),
      ),
    ).sort()

    const uniqueTitlesAndMetadata = await pMap(uniqueTitles, getMetadata, {
      concurrency: 5,
    })

    const allWithMetadata = screenings.map((screening) => {
      const metadata = uniqueTitlesAndMetadata.find(
        ({ query }) =>
          query === diacritics.remove(screening.title.toLowerCase()),
      )

      if (metadata && metadata.title) {
        return {
          ...screening,
          title: metadata.title,
        }
      } else {
        return screening
      }
    })

    return {
      // screenings,
      // searchResult,
      // searchImage,
      uniqueTitles,
      uniqueTitlesAndMetadata,
      allWithMetadata,
    }
  } catch (error) {
    console.error(error)
  }
}

const playground = async ({ event, context } = {}) => {
  // const results = await movieMetadataPlayground()
  // const results = await findMetadata('chungking express')
  // const results = await findMetadata('Caché')
  await getUsingChromium()

  // console.log(JSON.stringify(results, null, 2))
}

if (require.main === module) {
  playground()
}
const handler = middy(playground).use(
  injectLambdaContext(logger, { clearState: true }),
)

export default handler
