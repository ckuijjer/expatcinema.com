/**
 * Metadata Enricher Lambda
 *
 * Fetches TMDB/OMDB metadata for unique movie titles and enriches
 * the screening data with movie information.
 *
 * Memory: 512MB
 * Timeout: 5 minutes
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import middy from '@middy/core'
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import diacritics from 'diacritics'
import { Settings } from 'luxon'
import pMap from 'p-map'

import getMetadata from '../metadata'
import { logger as parentLogger } from '../powertools'
import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { Screening } from '../types'

// Set timezone for consistent date handling
Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})
const PARTIAL_BUCKET = process.env.PARTIAL_BUCKET

const logger = parentLogger.createChild({
  persistentLogAttributes: { lambda: 'metadata-enricher' },
})

export type MetadataEnricherEvent = {
  runId: string
  uniqueTitles: string[]
}

export type MetadataEnricherResult = {
  runId: string
  enrichedCount: number
  moviesWithMetadata: number
}

type AggregatedData = {
  screenings: Screening[]
  scraperCounts: Record<string, number>
  failedScrapers: string[]
}

const metadataEnricherHandler = async (
  event: MetadataEnricherEvent,
): Promise<MetadataEnricherResult> => {
  const { runId, uniqueTitles } = event

  logger.info('Starting metadata enrichment', {
    runId,
    uniqueTitlesCount: uniqueTitles.length,
  })

  // Read aggregated screenings from S3
  const getResponse = await s3Client.send(
    new GetObjectCommand({
      Bucket: PARTIAL_BUCKET,
      Key: `${runId}/aggregated.json`,
    }),
  )

  const bodyString = await getResponse.Body?.transformToString()
  if (!bodyString) {
    throw new Error('Failed to read aggregated data from S3')
  }

  const aggregatedData: AggregatedData = JSON.parse(bodyString)
  const { screenings, scraperCounts, failedScrapers } = aggregatedData

  logger.info('Loaded aggregated data', {
    screeningsCount: screenings.length,
    scraperCountsKeys: Object.keys(scraperCounts).length,
  })

  // Fetch metadata for all unique titles with concurrency control
  const uniqueTitlesAndMetadata = await pMap(uniqueTitles, getMetadata, {
    concurrency: 5,
  })

  const moviesWithMetadata = uniqueTitlesAndMetadata.filter(
    (m) => m?.title,
  ).length

  logger.info('Fetched metadata', {
    total: uniqueTitles.length,
    withMetadata: moviesWithMetadata,
  })

  // Enrich screenings with metadata
  const normalizeTitle = (title: string) =>
    diacritics.remove(title.toLowerCase())

  const enrichedScreenings = makeScreeningsUniqueAndSorted(
    screenings.map((movie) => {
      const metadata = uniqueTitlesAndMetadata.find(
        (m) => m?.query === normalizeTitle(movie.title),
      )

      if (metadata?.title) {
        return {
          ...movie,
          title: metadata.title,
          imdbUrl: `https://www.imdb.com/title/${metadata.imdbId}/`,
          tmdbUrl: `https://www.themoviedb.org/movie/${metadata.tmdb?.id}`,
        }
      }
      return movie
    }),
  )

  // Prepare movies data (metadata only)
  const movies = uniqueTitlesAndMetadata
    .filter((m): m is NonNullable<typeof m> => m?.title !== undefined)
    .map(({ query, createdAt, ...rest }) => rest)

  logger.info('Enrichment complete', {
    enrichedCount: enrichedScreenings.length,
    moviesCount: movies.length,
  })

  // Write enriched data to S3 for the storage step
  await s3Client.send(
    new PutObjectCommand({
      Bucket: PARTIAL_BUCKET,
      Key: `${runId}/enriched.json`,
      Body: JSON.stringify(
        {
          screenings,
          enrichedScreenings,
          movies,
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
    enrichedCount: enrichedScreenings.length,
    moviesWithMetadata,
  }
}

export const handler = middy(metadataEnricherHandler).use(
  injectLambdaContext(logger),
)
