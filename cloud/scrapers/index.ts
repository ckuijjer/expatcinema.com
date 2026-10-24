import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { mkdir, writeFile } from 'fs/promises'
import { DateTime, Settings } from 'luxon'
import { dirname, resolve } from 'path'

import documentClient from '../documentClient'
import { resolveMetadata } from '../metadata/resolveMetadata'
import {
  combineScreenings,
  normaliseScraperResult,
} from '../pipeline/normalise'
import { resolveScreenings } from '../pipeline/resolve'
import { runScrapers } from '../pipeline/scrape'
import { logger } from '../powertools'
import { triggerWebDeploy } from '../triggerWebDeploy'
import { getEnabledScrapers, SCRAPERS } from './registry'
// Set the default timezone to Europe/Amsterdam, otherwise AWS Lambda will scrape as UTC and running it locally
// as Europe/Amsterdam
Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})

const PRIVATE_BUCKET = process.env.PRIVATE_BUCKET
const PUBLIC_BUCKET = process.env.PUBLIC_BUCKET
if (!PRIVATE_BUCKET || !PUBLIC_BUCKET) {
  throw new Error('PRIVATE_BUCKET and PUBLIC_BUCKET must be set')
}

const now = DateTime.fromObject({}).toUTC().toISO()

const writeToFileInBucket =
  (bucket: string) => (filename: string) => async (data: object) => {
    const dataJson = JSON.stringify(data, null, 2)

    if (process.env.IS_LOCAL) {
      const path = `./output/${bucket}/${filename}`
      logger.info('writing local file', {
        bucket,
        filename,
        path: resolve(path),
      })
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, dataJson)
    } else {
      const params = {
        Bucket: bucket,
        Key: filename,
        Body: dataJson,
      }
      return s3Client.send(new PutObjectCommand(params))
    }
  }

const writeToFile = writeToFileInBucket(PRIVATE_BUCKET)
const writeToPublicFile = writeToFileInBucket(PUBLIC_BUCKET)

const writeToAnalytics =
  (type: string) => async (fields: Record<string, unknown>) => {
    if (process.env.IS_LOCAL) {
      const path = `./output/analytics/${type}.json`
      logger.info('writing local analytics file', {
        type,
        path: resolve(path),
      })
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, JSON.stringify(fields, null, 2))
    } else {
      const putCommand = new PutCommand({
        TableName: process.env.DYNAMODB_ANALYTICS,
        Item: {
          type,
          createdAt: now,
          ...fields,
        },
      })

      return await documentClient.send(putCommand)
    }
  }

export const scrapers = async () => {
  try {
    const ENABLED_SCRAPERS = getEnabledScrapers()

    logger.info('starting scrapers', {
      availableScrapers: Object.keys(SCRAPERS).length,
      enabledScrapers: Object.keys(ENABLED_SCRAPERS).length,
      enabled: Object.keys(ENABLED_SCRAPERS),
    })

    const results = Object.fromEntries(
      Object.entries(await runScrapers(ENABLED_SCRAPERS)).map(
        ([name, result]) => [name, normaliseScraperResult(result)],
      ),
    )

    const allRawScreenings = combineScreenings(results)

    const {
      metadataLookups,
      metadata: uniqueTitlesAndMetadataWithSiblingHints,
    } = await resolveMetadata(allRawScreenings)

    const resolved = resolveScreenings(allRawScreenings, {
      metadata: uniqueTitlesAndMetadataWithSiblingHints,
      metadataLookups,
    })

    const privateResults = {
      ...results,
      all: resolved.screenings,
    }

    logger.info('writing all to private S3 bucket')
    await Promise.all(
      Object.entries(privateResults).map(
        async ([name, data]) => await writeToFile(`${name}/${now}.json`)(data),
      ),
    )

    await writeToFile(`review/ambiguous-movies/${now}.json`)(
      resolved.review.ambiguous,
    )
    await writeToFile(`review/unmatched-movies/${now}.json`)(
      resolved.review.unmatched,
    )
    await writeToFile(`review/director-disagreements/${now}.json`)(
      resolved.review.directorDisagreements,
    )

    logger.info('writing all, the combined json, to public S3 bucket')
    await writeToPublicFile('screenings.json')(resolved.screenings)
    await writeToPublicFile('movies.json')(resolved.movies)
    await writeToPublicFile('title-matches.json')(resolved.titleMatches)

    const countPerScraper = {
      ...Object.fromEntries(
        Object.entries(results).map(([name, data]) => [name, data.length]),
      ),
      all: allRawScreenings.length,
      allWithMovieId: resolved.screenings.filter(({ movieId }) =>
        Boolean(movieId),
      ).length,
    }

    logger.info('writing to analytics', { countPerScraper })
    await writeToAnalytics('count')(countPerScraper)

    if (!process.env.IS_LOCAL) {
      await triggerWebDeploy()
    }
  } catch (error) {
    logger.error('error scraping (main loop)', { error })
  }
}
