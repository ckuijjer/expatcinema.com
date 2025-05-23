// should be your first import
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import diacritics from 'diacritics'
import got from 'got'
import { DateTime, Settings } from 'luxon'
import pMap from 'p-map'
import whyIsNodeRunning from 'why-is-node-running'

import { closeBrowser, getBrowser } from './browser'
import getMetadata from './metadata'
import { logger as parentLogger } from './powertools'
import { Screening } from './types'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'playground',
  },
})

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

  // page.waitForResponse((response) => {
  //   logger.info('waitForResponse', { response })
  // })

  await page.goto('https://florafilmtheater.nl/')

  await page.waitForSelector('body')
  const textContent = await page.evaluate(
    () => document.querySelector('a').textContent,
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

const getUsingGot = async () => {
  const url =
    'https://kinepolisweb-programmation.kinepolis.com/api/Programmation/NL/NL/WWW/Cinema/Cinerama'
  const scrapeOpsProxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${
    process.env.SCRAPEOPS_API_KEY
  }&url=${encodeURIComponent(url)}&residential=true`

  const json = await got(scrapeOpsProxyUrl, {
    headers: {
      authority: 'kinepolisweb-programmation.kinepolis.com',
      //   accept: 'application/json, text/javascript, */*; q=0.01',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9',
      'if-modified-since': 'Wed, 04 Oct 2023 19:44:34 GMT',
      'if-none-match': '"14021a8ddd8adf9db8db447b7f94cc59:1696448674.360531"',
      'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      Referer: 'https://cineramabios.nl/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    },
  }).json()

  logger.info('result', { json })
  return json
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

const playground = async ({ event, context } = {}) => {
  try {
    // const result = await movieMetadataPlayground()
    // const result = await findMetadata('chungking express')
    // const result = await findMetadata('Caché')
    const result = await getUsingChromium()
    // const result = await getUsingGot()
    // const result = await getLux()

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
