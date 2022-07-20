import { Context, APIGatewayEvent } from 'aws-lambda'

import { DateTime, Settings } from 'luxon'
import * as R from 'ramda'
import AWS from 'aws-sdk'
import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import debugFn from 'debug'

import documentClient from '../documentClient'
import applyFilters from './filters'

// TODO: esbuild doesn't support dynamic import, hence all the imports below
// SCRAPERS.map(async (name) => {
//   const fn = await import(`./${name}`)
//   return [name, sort(await fn())]
// }),
import bioscopenleiden from './bioscopenleiden'
import eyefilm from './eyefilm'
import filmhuisdenhaag from './filmhuisdenhaag'
import kinorotterdam from './kinorotterdam'
import kriterion from './kriterion'
import lab111 from './lab111'
import lantarenvenster from './lantarenvenster'
import springhaver from './springhaver'
import hartlooper from './hartlooper'
import rialto from './rialto'
import cinecenter from './cinecenter'
import liff from './liff'
import filmhuislumen from './filmhuislumen'
import forumgroningen from './forumgroningen'
import ketelhuis from './ketelhuis'

const SCRAPERS = {
  bioscopenleiden,
  eyefilm,
  filmhuisdenhaag,
  kinorotterdam,
  kriterion,
  lab111,
  lantarenvenster,
  springhaver,
  hartlooper,
  // rialto,
  cinecenter,
  // liff,
  filmhuislumen,
  forumgroningen,
  // ketelhuis,
}

const debug = debugFn('combined scraper')

// Set the default timezone to Europe/Amsterdam, otherwise AWS Lambda will scrape as UTC and running it locally
// as Europe/Amsterdam
Settings.defaultZone = 'Europe/Amsterdam'

const s3 = new AWS.S3()

const PRIVATE_BUCKET = 'expatcinema-scrapers-output'
const PUBLIC_BUCKET = 'expatcinema-public'

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
  const ENABLED_SCRAPERS = getEnabledScrapers()

  debug('start scraping %O', SCRAPERS)
  debug('start enabled scraping %O', ENABLED_SCRAPERS)

  const results = Object.fromEntries(
    await Promise.all(
      Object.entries(ENABLED_SCRAPERS).map(async ([name, fn]) => {
        return [name, sort(await fn())]
      }),
    ),
  )
  debug('done scraping')

  results.all = sort(Object.values(results).flat())
  results.filtered = applyFilters(results.all)

  debug('writing all to private S3 bucket')
  await Promise.all(
    Object.entries(results).map(
      async ([name, data]) => await writeToFile(`${name}/${now}.json`)(data),
    ),
  )

  debug('writing filtered to public S3 bucket')
  await writeToPublicFile('screenings.json')(results.filtered)

  const countPerScraper = Object.fromEntries(
    Object.entries(results).map(([name, data]) => [name, data.length]),
  )

  debug('writing to analytics json %O', countPerScraper)
  await writeToAnalytics('count')(countPerScraper)
}

export default scrapers
