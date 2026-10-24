import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { mkdir, writeFile } from 'fs/promises'
import { DateTime } from 'luxon'
import { dirname, resolve } from 'path'

import documentClient from '../documentClient'
import { logger } from '../powertools'
import { triggerWebDeploy } from '../triggerWebDeploy'
import { Screening } from '../types'
import type { resolveScreenings } from './resolve'

// Phase: publish. Writes what the earlier phases made to the private and the
// public bucket (or to ./output when running locally), the counts to the
// analytics, and has the web deployed. This is the only phase, together with
// scrape, that talks to anything outside the Lambda.
export const createPublisher = () => {
  const PRIVATE_BUCKET = process.env.PRIVATE_BUCKET
  const PUBLIC_BUCKET = process.env.PUBLIC_BUCKET
  if (!PRIVATE_BUCKET || !PUBLIC_BUCKET) {
    throw new Error('PRIVATE_BUCKET and PUBLIC_BUCKET must be set')
  }

  const s3Client = new S3Client({})

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
    (type: string, createdAt: string | null) =>
    async (fields: Record<string, unknown>) => {
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
            createdAt,
            ...fields,
          },
        })

        return await documentClient.send(putCommand)
      }
    }

  return async ({
    resultsPerScraper,
    allRawScreenings,
    resolved,
  }: {
    // what each scraper gave, cleaned up
    resultsPerScraper: Record<string, Screening[]>
    allRawScreenings: Screening[]
    resolved: ReturnType<typeof resolveScreenings>
  }) => {
    // per run, not when the module loads: a warm Lambda runs this again
    const now = DateTime.fromObject({}).toUTC().toISO()

    const privateResults = {
      ...resultsPerScraper,
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
    await writeToFile(`review/detected-events/${now}.json`)(
      resolved.review.detectedEvents,
    )

    logger.info('writing all, the combined json, to public S3 bucket')
    await writeToPublicFile('screenings.json')(resolved.screenings)
    await writeToPublicFile('movies.json')(resolved.movies)
    await writeToPublicFile('title-matches.json')(resolved.titleMatches)

    const countPerScraper = {
      ...Object.fromEntries(
        Object.entries(resultsPerScraper).map(([name, data]) => [
          name,
          data.length,
        ]),
      ),
      all: allRawScreenings.length,
      allWithMovieId: resolved.screenings.filter(({ movieId }) =>
        Boolean(movieId),
      ).length,
    }

    logger.info('writing to analytics', { countPerScraper })
    await writeToAnalytics('count', now)(countPerScraper)

    if (!process.env.IS_LOCAL) {
      await triggerWebDeploy()
    }
  }
}
