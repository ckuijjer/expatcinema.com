import { Context, APIGatewayEvent } from 'aws-lambda'

import { DateTime, Settings } from 'luxon'
import * as R from 'ramda'
import AWS from 'aws-sdk'
import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import diacritics from 'diacritics'
import pMap from 'p-map'
import { injectLambdaContext } from '@aws-lambda-powertools/logger'
import middy from '@middy/core'

import documentClient from '../documentClient'
import getMetadata from '../metadata'

// TODO: esbuild doesn't support dynamic import, hence all the imports below
// SCRAPERS.map(async (name) => {
//   const fn = await import(`./${name}`)
//   return [name, sort(await fn())]
// }),
import bioscopenleiden from './bioscopenleiden'
import cinecenter from './cinecenter'
import cinecitta from './cinecitta'
import deuitkijk from './deuitkijk'
import eyefilm from './eyefilm'
import filmhuisdenhaag from './filmhuisdenhaag'
import filmhuislumen from './filmhuislumen'
import forumgroningen from './forumgroningen'
import hartlooper from './hartlooper'
import ketelhuis from './ketelhuis'
import kinorotterdam from './kinorotterdam'
import kriterion from './kriterion'
import lab1 from './lab1'
import lab111 from './lab111'
import lantarenvenster from './lantarenvenster'
import liff from './liff'
import lumiere from './lumiere'
import rialto from './rialto'
import schuur from './schuur'
import slachtstraat from './slachtstraat'
import springhaver from './springhaver'
import studiok from './studiok'
import themovies from './themovies'

const SCRAPERS = {
  bioscopenleiden,
  cinecenter,
  cinecitta,
  deuitkijk,
  eyefilm,
  filmhuisdenhaag,
  filmhuislumen,
  forumgroningen,
  hartlooper,
  ketelhuis,
  kinorotterdam,
  kriterion,
  lab1,
  lab111,
  lantarenvenster,
  // liff,
  lumiere,
  rialto,
  schuur,
  slachtstraat,
  springhaver,
  studiok,
  themovies,
}

import { logger as parentLogger } from '../powertools'
import { Screening } from 'types'
import { closeBrowser } from '../browser'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'combined',
  },
})

// Set the default timezone to Europe/Amsterdam, otherwise AWS Lambda will scrape as UTC and running it locally
// as Europe/Amsterdam
Settings.defaultZone = 'Europe/Amsterdam'

const s3 = new AWS.S3()

const PRIVATE_BUCKET = process.env.PRIVATE_BUCKET
const PUBLIC_BUCKET = process.env.PUBLIC_BUCKET

const sort = R.sortWith([
  R.ascend(R.prop('date')),
  R.ascend(R.prop('cinema')),
  R.ascend(R.prop('title')),
  R.ascend(R.prop('url')),
])

const now = DateTime.fromObject({}).toUTC().toISO()

const writeToFileInBucket =
  (bucket: string) => (filename: string) => async (data: object) => {
    const dataJson = JSON.stringify(data, null, 2)

    if (process.env.IS_LOCAL) {
      // serverless invoke local // TODO: currently stores in .esbuild/output instead of output/, fix this
      const path = `./output/${bucket}/${filename}`
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, dataJson)
    } else {
      const params = {
        Bucket: bucket,
        Key: filename,
        Body: dataJson,
      }
      return s3.putObject(params).promise()
    }
  }

const writeToFile = writeToFileInBucket(PRIVATE_BUCKET)
const writeToPublicFile = writeToFileInBucket(PUBLIC_BUCKET)

const writeToAnalytics = (type) => async (fields) => {
  if (process.env.IS_LOCAL) {
    // serverless invoke local // TODO: currently stores in .esbuild/output instead of output/, fix this
    const path = `./output/analytics/${type}.json`
    await mkdir(dirname(path), { recursive: true })
    return writeFile(path, JSON.stringify(fields, null, 2))
  } else {
    const params = {
      TableName: process.env.DYNAMODB_ANALYTICS,
      Item: {
        type,
        createdAt: now,
        ...fields,
      },
    }
    return await documentClient.put(params).promise()
  }
}

const getEnabledScrapers = () => {
  if (process.env.SCRAPERS) {
    return Object.fromEntries(
      Object.entries(SCRAPERS).filter(([name, fn]) => {
        return process.env.SCRAPERS?.split(',').includes(name)
      }),
    )
  }

  return SCRAPERS
}

const scrapers = async (event: APIGatewayEvent, context: Context) => {
  try {
    const ENABLED_SCRAPERS = getEnabledScrapers()

    logger.info('available scrapers', { SCRAPERS: Object.keys(SCRAPERS) })
    logger.info('enabled scrapers', {
      ENABLED_SCRAPERS: Object.keys(ENABLED_SCRAPERS),
    })
    logger.info('number of scrapers', {
      numberOfAvailableScrapers: Object.keys(SCRAPERS).length,
      numberOfEnabledScrapers: Object.keys(ENABLED_SCRAPERS).length,
    })

    const results = Object.fromEntries(
      await Promise.all(
        Object.entries(ENABLED_SCRAPERS).map(async ([name, fn]) => {
          logger.info('start scraping', { scraper: name })

          // call the scraper function
          let result: Screening[] = []
          try {
            result = await fn()
          } catch (error) {
            logger.error('error scraping', { scraper: name, error })
          }

          logger.info('done scraping', {
            scraper: name,
            numberOfResults: result?.length,
          })

          return [name, sort(result)]
        }),
      ),
    )

    // close the browser
    await closeBrowser({ logger })

    logger.info('done scraping')

    results.all = sort(Object.values(results).flat())

    // get metadata for all movies
    const normalizeTitle = (title) => diacritics.remove(title.toLowerCase())

    const uniqueTitles = Array.from(
      new Set(results.all.map(({ title }) => normalizeTitle(title))),
    ).sort()

    const uniqueTitlesAndMetadata = await pMap(uniqueTitles, getMetadata, {
      concurrency: 5,
    })

    results.allWithMetadata = sort(
      results.all.map((movie) => {
        const metadata = uniqueTitlesAndMetadata.find(
          (metadata) => metadata.query === normalizeTitle(movie.title),
        )

        if (metadata?.title) {
          return {
            ...movie,
            title: metadata.title,
          }
        } else {
          return movie
        }
      }),
    )

    logger.info('writing all to private S3 bucket')
    await Promise.all(
      Object.entries(results).map(
        async ([name, data]) => await writeToFile(`${name}/${now}.json`)(data),
      ),
    )

    const movies = uniqueTitlesAndMetadata.map(
      ({ query, createdAt, ...rest }) => {
        return { ...rest }
      },
    )

    logger.info('writing all, the combined json, to public S3 bucket')
    await writeToPublicFile('screenings.json')(results.allWithMetadata)
    await writeToPublicFile('movies.json')(movies)

    const countPerScraper = Object.fromEntries(
      Object.entries(results).map(([name, data]) => [name, data.length]),
    )

    logger.warn('writing to analytics json', { countPerScraper })
    await writeToAnalytics('count')(countPerScraper)
  } catch (error) {
    logger.error('error scraping', { error })
  }
}

const handler = middy(scrapers).use(
  injectLambdaContext(logger, { clearState: true }),
)

export default handler
