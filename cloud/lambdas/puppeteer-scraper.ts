/**
 * Puppeteer Scraper Lambda
 *
 * Executes a single Puppeteer-based scraper and writes results to S3.
 * This Lambda is invoked by the Step Functions Map state for each Puppeteer scraper.
 *
 * Memory: 4096MB (required for Chromium)
 * Timeout: 5 minutes
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import middy from '@middy/core'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { Settings } from 'luxon'

import { closeBrowser } from '../browser'
import { logger as parentLogger } from '../powertools'
import { PUPPETEER_SCRAPERS } from '../scrapers/registry'
import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { Screening } from '../types'

// Set timezone for consistent date handling
Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})
const PARTIAL_BUCKET = process.env.PARTIAL_BUCKET

const logger = parentLogger.createChild({
  persistentLogAttributes: { lambda: 'puppeteer-scraper' },
})

export type PuppeteerScraperEvent = {
  scraperName: string
  runId: string
}

export type PuppeteerScraperResult = {
  scraperName: string
  count: number
  success: boolean
  error?: string
}

const puppeteerScraperHandler = async (
  event: PuppeteerScraperEvent,
): Promise<PuppeteerScraperResult> => {
  const { scraperName, runId } = event

  logger.info('Starting Puppeteer scraper', { scraperName, runId })

  const scraper = PUPPETEER_SCRAPERS[scraperName]

  if (!scraper) {
    logger.error('Scraper not found', { scraperName })
    return {
      scraperName,
      count: 0,
      success: false,
      error: `Scraper '${scraperName}' not found in PUPPETEER_SCRAPERS registry`,
    }
  }

  try {
    const screenings: Screening[] = await scraper()
    const uniqueScreenings = makeScreeningsUniqueAndSorted(screenings)

    logger.info('Scraper completed', {
      scraperName,
      rawCount: screenings.length,
      uniqueCount: uniqueScreenings.length,
    })

    // Write partial results to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: PARTIAL_BUCKET,
        Key: `${runId}/${scraperName}.json`,
        Body: JSON.stringify(uniqueScreenings, null, 2),
        ContentType: 'application/json',
      }),
    )

    logger.info('Written to S3', {
      scraperName,
      bucket: PARTIAL_BUCKET,
      key: `${runId}/${scraperName}.json`,
    })

    return {
      scraperName,
      count: uniqueScreenings.length,
      success: true,
    }
  } catch (error) {
    logger.error('Scraper failed', { scraperName, error })

    return {
      scraperName,
      count: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    // Always close the browser to free resources
    try {
      await closeBrowser({ logger })
    } catch (error) {
      logger.warn('Failed to close browser', { error })
    }
  }
}

export const handler = middy(puppeteerScraperHandler).use(
  injectLambdaContext(logger),
)
