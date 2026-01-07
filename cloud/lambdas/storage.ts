/**
 * Storage Lambda
 *
 * Writes final results to public S3 bucket and analytics to DynamoDB.
 * This is the final step in the Step Functions workflow.
 *
 * Memory: 256MB
 * Timeout: 2 minutes
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { DateTime, Settings } from 'luxon'

import documentClient from '../documentClient'
import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'

// Set timezone for consistent date handling
Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})
const PARTIAL_BUCKET = process.env.PARTIAL_BUCKET
const PUBLIC_BUCKET = process.env.PUBLIC_BUCKET
const PRIVATE_BUCKET = process.env.PRIVATE_BUCKET
const DYNAMODB_ANALYTICS = process.env.DYNAMODB_ANALYTICS

const logger = parentLogger.createChild({
  persistentLogAttributes: { lambda: 'storage' },
})

export type StorageEvent = {
  runId: string
}

export type StorageResult = {
  runId: string
  publicFiles: string[]
  analyticsWritten: boolean
}

type EnrichedData = {
  screenings: Screening[]
  enrichedScreenings: Screening[]
  movies: Array<Record<string, unknown>>
  scraperCounts: Record<string, number>
  failedScrapers: string[]
}

const storageHandler = async (event: StorageEvent): Promise<StorageResult> => {
  const { runId } = event
  const now = DateTime.fromObject({}).toUTC().toISO()

  logger.info('Starting storage', { runId })

  // Read enriched data from S3
  const getResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: PARTIAL_BUCKET,
      Key: `${runId}/enriched.json`,
    }),
  )

  const bodyString = await getResponse.Body?.transformToString()
  if (!bodyString) {
    throw new Error('Failed to read enriched data from S3')
  }

  const enrichedData: EnrichedData = JSON.parse(bodyString)
  const { screenings, enrichedScreenings, movies, scraperCounts, failedScrapers } =
    enrichedData

  logger.info('Loaded enriched data', {
    screeningsCount: screenings.length,
    enrichedScreeningsCount: enrichedScreenings.length,
    moviesCount: movies.length,
  })

  const publicFiles: string[] = []

  // Write to public S3 bucket
  const writePublicFile = async (filename: string, data: unknown) => {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: PUBLIC_BUCKET,
        Key: filename,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
      }),
    )
    publicFiles.push(filename)
    logger.info('Written to public bucket', { filename })
  }

  await Promise.all([
    writePublicFile('screenings-without-metadata.json', screenings),
    writePublicFile('screenings-with-metadata.json', enrichedScreenings),
    writePublicFile('screenings.json', screenings), // Main file used by frontend
    writePublicFile('movies.json', movies),
  ])

  // Write to private S3 bucket (archive)
  await s3Client.send(
    new PutObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: `all/${now}.json`,
      Body: JSON.stringify(screenings, null, 2),
      ContentType: 'application/json',
    }),
  )
  logger.info('Written archive to private bucket', { key: `all/${now}.json` })

  // Write individual scraper results to private bucket
  const scraperPromises = Object.entries(scraperCounts).map(
    async ([scraperName, count]) => {
      // Read the scraper's partial result
      try {
        const scraperResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: PARTIAL_BUCKET,
            Key: `${runId}/${scraperName}.json`,
          }),
        )
        const scraperData = await scraperResponse.Body?.transformToString()
        if (scraperData) {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: PRIVATE_BUCKET,
              Key: `${scraperName}/${now}.json`,
              Body: scraperData,
              ContentType: 'application/json',
            }),
          )
        }
      } catch (error) {
        logger.warn('Failed to archive scraper result', { scraperName, error })
      }
    },
  )
  await Promise.all(scraperPromises)

  // Write analytics to DynamoDB
  const countPerScraper = {
    ...scraperCounts,
    all: screenings.length,
    allWithMetadata: enrichedScreenings.length,
  }

  const putCommand = new PutCommand({
    TableName: DYNAMODB_ANALYTICS,
    Item: {
      type: 'count',
      createdAt: now,
      ...countPerScraper,
      failedScrapers,
    },
  })

  await documentClient.send(putCommand)
  logger.warn('Written to analytics', { countPerScraper })

  logger.info('Storage complete', {
    publicFilesCount: publicFiles.length,
    analyticsWritten: true,
  })

  return {
    runId,
    publicFiles,
    analyticsWritten: true,
  }
}

export const handler = middy(storageHandler).use(injectLambdaContext(logger))
