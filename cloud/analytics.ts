import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DateTime, Settings } from 'luxon'
import pMap from 'p-map'

import documentClient from './documentClient'

Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})

type AnalyticsRow = {
  type: string
  createdAt: string
  all?: number
  allWithMovieId?: number
  allWithMetadata?: number
} & Record<string, unknown>

type ScreeningWithMovieId = {
  movieId?: string
}

const getAllScreeningsFromS3 = async (
  createdAt: string,
): Promise<ScreeningWithMovieId[]> => {
  const command = new GetObjectCommand({
    Bucket: process.env.PRIVATE_BUCKET,
    Key: `all/${createdAt}.json`,
  })

  const data = await s3Client.send(command)
  const body = await data.Body?.transformToString()

  return JSON.parse(body ?? '[]')
}

const withAggregateCounts = async (
  item: AnalyticsRow,
): Promise<AnalyticsRow> => {
  const existingAllWithMovieId =
    typeof item.allWithMovieId === 'number'
      ? Number(item.allWithMovieId)
      : undefined
  const existingAllWithMetadata =
    typeof item.allWithMetadata === 'number'
      ? Number(item.allWithMetadata)
      : undefined
  const existingAll =
    typeof item.all === 'number' ? Number(item.all) : undefined

  if (existingAll !== undefined && existingAllWithMovieId !== undefined) {
    return {
      ...item,
      all: existingAll,
      allWithMovieId: existingAllWithMovieId,
    }
  }

  if (existingAll !== undefined && existingAllWithMetadata !== undefined) {
    return {
      ...item,
      all: existingAll,
      allWithMovieId: existingAllWithMetadata,
    }
  }

  try {
    const screenings = await getAllScreeningsFromS3(String(item.createdAt))

    return {
      ...item,
      all: existingAll,
      allWithMovieId:
        existingAllWithMovieId ??
        existingAllWithMetadata ??
        screenings.filter((screening) => Boolean(screening.movieId)).length,
    }
  } catch {
    return item
  }
}

const analytics = async (_input = {}) => {
  const fourWeeksAgo = DateTime.now().minus({ weeks: 4 }).startOf('day').toISO()

  const queryCommand = new QueryCommand({
    TableName: process.env.DYNAMODB_ANALYTICS,
    KeyConditionExpression: '#type = :type and createdAt >= :createdAt',
    ExpressionAttributeNames: {
      '#type': 'type',
    },
    ExpressionAttributeValues: {
      ':type': 'count',
      ':createdAt': fourWeeksAgo,
    },
  })

  const data = await documentClient.send(queryCommand)
  const items: AnalyticsRow[] = await pMap(
    (data.Items ?? []) as AnalyticsRow[],
    withAggregateCounts,
    {
      concurrency: 5,
    },
  )

  // convert to data points of the type type, createdAt, count, and scraper
  const dataPoints = items.flatMap(({ type, createdAt, ...rest }) =>
    Object.entries(rest).map(([scraper, value]) => ({
      type,
      createdAt,
      scraper,
      value,
    })),
  )

  return {
    statusCode: 200,
    body: JSON.stringify(dataPoints, null, 2),
  }
}

export const handler = analytics
