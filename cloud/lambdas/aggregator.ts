/**
 * Aggregator Lambda
 *
 * Reads all partial scraper results from S3, combines them, deduplicates,
 * and prepares the data for metadata enrichment.
 *
 * Memory: 512MB
 * Timeout: 3 minutes
 */

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import middy from '@middy/core'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import diacritics from 'diacritics'
import { Settings } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { Screening } from '../types'

// Set timezone for consistent date handling
Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})
const PARTIAL_BUCKET = process.env.PARTIAL_BUCKET

const logger = parentLogger.createChild({
  persistentLogAttributes: { lambda: 'aggregator' },
})

export type AggregatorEvent = {
  runId: string
  httpResults: Array<{ scraperName: string; count: number; success: boolean }>
  puppeteerResults: Array<{
    scraperName: string
    count: number
    success: boolean
  }>
}

export type AggregatorResult = {
  runId: string
  totalScreenings: number
  uniqueTitles: string[]
  scraperCounts: Record<string, number>
  failedScrapers: string[]
}

const aggregatorHandler = async (
  event: AggregatorEvent,
): Promise<AggregatorResult> => {
  const { runId, httpResults, puppeteerResults } = event

  logger.info('Starting aggregation', {
    runId,
    httpResultsCount: httpResults.length,
    puppeteerResultsCount: puppeteerResults.length,
  })

  const allResults = [...httpResults, ...puppeteerResults]
  const successfulScrapers = allResults.filter((r) => r.success)
  const failedScrapers = allResults
    .filter((r) => !r.success)
    .map((r) => r.scraperName)

  logger.info('Scraper summary', {
    total: allResults.length,
    successful: successfulScrapers.length,
    failed: failedScrapers.length,
    failedScrapers,
  })

  // List all partial result files for this run
  const listResponse = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: PARTIAL_BUCKET,
      Prefix: `${runId}/`,
    }),
  )

  const files = listResponse.Contents || []
  logger.info('Found partial result files', { count: files.length })

  // Read all partial results
  const allScreenings: Screening[] = []
  const scraperCounts: Record<string, number> = {}

  for (const file of files) {
    if (!file.Key) continue

    const scraperName = file.Key.replace(`${runId}/`, '').replace('.json', '')

    try {
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: PARTIAL_BUCKET,
          Key: file.Key,
        }),
      )

      const bodyString = await getResponse.Body?.transformToString()
      if (bodyString) {
        const screenings: Screening[] = JSON.parse(bodyString)
        allScreenings.push(...screenings)
        scraperCounts[scraperName] = screenings.length

        logger.info('Loaded partial results', {
          scraperName,
          count: screenings.length,
        })
      }
    } catch (error) {
      logger.error('Failed to read partial result', {
        file: file.Key,
        error,
      })
    }
  }

  // Deduplicate and sort all screenings
  const uniqueScreenings = makeScreeningsUniqueAndSorted(allScreenings)

  logger.info('Aggregation complete', {
    totalRaw: allScreenings.length,
    totalUnique: uniqueScreenings.length,
  })

  // Extract unique normalized titles for metadata enrichment
  const normalizeTitle = (title: string) =>
    diacritics.remove(title.toLowerCase())
  const uniqueTitles = Array.from(
    new Set(uniqueScreenings.map(({ title }) => normalizeTitle(title))),
  ).sort()

  logger.info('Extracted unique titles', { count: uniqueTitles.length })

  // Write aggregated results to S3 for the next step
  await s3Client.send(
    new PutObjectCommand({
      Bucket: PARTIAL_BUCKET,
      Key: `${runId}/aggregated.json`,
      Body: JSON.stringify(
        {
          screenings: uniqueScreenings,
          scraperCounts,
          failedScrapers,
        },
        null,
        2,
      ),
      ContentType: 'application/json',
    }),
  )

  return {
    runId,
    totalScreenings: uniqueScreenings.length,
    uniqueTitles,
    scraperCounts,
    failedScrapers,
  }
}

export const handler = middy(aggregatorHandler).use(
  injectLambdaContext(logger),
)
