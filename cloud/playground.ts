// should be your first import
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import got from 'got'
import { DateTime, Settings } from 'luxon'
import pMap from 'p-map'
import whyIsNodeRunning from 'why-is-node-running'

import { closeBrowser, getBrowser } from './browser'
import getMetadata from './metadata'
import { logger as parentLogger } from './powertools'
import { normalizeMovieTitleForLookup } from './metadata/titleResolver'
import { useLLM } from './scrapers/utils/useLLM'
import { Screening } from './types'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'playground',
  },
})

Settings.defaultZone = 'Europe/Amsterdam'

const timezonePlayground = async (
  _input: { event?: unknown; context?: unknown } = {},
) => {
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

  // page.waitForResponse((response) => {
  //   logger.info('waitForResponse', { response })
  // })

  await page.goto('https://florafilmtheater.nl/')

  await page.waitForSelector('body')
  const textContent = await page.evaluate(
    () =>
      (
        globalThis as unknown as {
          document: {
            querySelector: (selector: string) => {
              textContent?: string | null
            } | null
          }
        }
      ).document.querySelector('a')?.textContent,
  )

  logger.info('First link' + textContent)
  return textContent
}

const movieMetadataPlayground = async () => {
  try {
    const screenings: Screening[] = await got
      .get(
        `https://s3-eu-west-1.amazonaws.com/expatcinema-public-prod/screenings.json`,
      )
      .json()

    const uniqueTitles = Array.from(
      new Set(screenings.map(({ title }) => title)),
    ).sort()

    const uniqueTitlesAndMetadata = await pMap(
      uniqueTitles.map((title) => ({ title })),
      getMetadata,
      {
        concurrency: 5,
      },
    )

    const allWithMovieId = screenings.map((screening) => {
      const metadata = uniqueTitlesAndMetadata.find(
        ({ query }) => query === normalizeMovieTitleForLookup(screening.title),
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
      allWithMovieId,
    }
  } catch (error) {
    console.error(error)
  }
}

const getLux = async () => {
  const response = await got(
    'https://www.lux-nijmegen.nl/wp-json/lux/v1/discover',
    {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-key':
          '{"types":[],"genres":[122],"tags":[],"search":"","isVerwacht":false}',
        'content-type': 'application/json',
      },
      body: '{"types":[],"genres":[122],"tags":[],"search":"","isVerwacht":false}',
      method: 'POST',
    },
  ).json()

  return response
}

const playground = async (
  _input: { event?: unknown; context?: unknown } = {},
) => {
  try {
    // const result = await movieMetadataPlayground()
    // const result = await findMetadata('chungking express')
    // const result = await findMetadata('Caché')
    // const result = await getUsingChromium()
    // const result = await getUsingGot()
    // const result = await getLux()

    const reply = await useLLM(`Give me a random movie title`)
    const result = { reply }

    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    logger.error('error in playground', { error })
  }
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  playground() // needs await, but the lamdba handler doesn't support top level async functions in commonjs
  logger.info('closing browser now 🌎🌍🌏')
  closeBrowser({ logger }) // needs await, but the lamdba handler doesn't support top level async functions in commonjs
  logger.info('done 🎉')

  setImmediate(() => whyIsNodeRunning())
}

export const handler = middy(playground).use(
  injectLambdaContext(logger, { clearState: true }),
)
