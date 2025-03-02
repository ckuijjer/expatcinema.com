// Used for the initial filling of the analytics DynamoDB table based on the contents of the scrapers S3 bucket
// TODO: untested after migrating from v2 to v3 of the AWS SDK
import {
  GetObjectCommand,
  S3Client,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import pMap from 'p-map'

import documentClient from './documentClient'

const s3Client = new S3Client({})

const PRIVATE_BUCKET = process.env.PRIVATE_BUCKET

const getAllKeysFromS3 = async () => {
  const keys = []
  for await (const data of paginateListObjectsV2(
    { client: s3Client },
    {
      Bucket: PRIVATE_BUCKET,
    },
  )) {
    keys.push(...(data.Contents || []).map((x) => x.Key))
  }
  return keys
}

const addScraperAndCreatedAt = (keys) => {
  return keys.map((key) => {
    const matches = /(?<scraper>.*)\/(?<createdAt>.*Z).*\.json/.exec(key)
    return { key, ...(matches?.groups ?? {}) }
  })
}

const writeToAnalytics = async (data) => {
  const putCommand = new PutCommand({
    TableName: process.env.DYNAMODB_ANALYTICS,
    Item: {
      type: 'count',
      ...data,
    },
  })
  return await documentClient.send(putCommand)
}

const fillAnalytics = async ({ event, context } = {}) => {
  const keys = await getAllKeysFromS3()

  const keyAndScraperAndCreatedAt = addScraperAndCreatedAt(keys)

  const keyAndScraperAndCreatedAtAndCount = await pMap(
    keyAndScraperAndCreatedAt,
    async ({ key, ...rest }) => {
      const object = await getObjectFromS3(key)
      const count = object.length

      return { key, count, ...rest }
    },
    { concurrency: 100 },
  )

  const byCreatedAtObject = keyAndScraperAndCreatedAtAndCount.reduce(
    (acc, cur) => {
      if (!acc[cur.createdAt]) {
        acc[cur.createdAt] = {}
      }

      acc[cur.createdAt][cur.scraper] = cur.count
      return acc
    },
    {},
  )

  const byCreatedAtArray = Object.entries(byCreatedAtObject).map(
    ([createdAt, data]) => ({ createdAt, ...data }),
  )

  await pMap(byCreatedAtArray, writeToAnalytics, { concurrency: 100 })
}

const getObjectFromS3 = async (key) => {
  const command = new GetObjectCommand({
    Bucket: PRIVATE_BUCKET,
    Key: key,
  })

  const data = await s3Client.send(command)
  const body = data.Body.toString()
  const json = JSON.parse(body)

  return json
}

export const handler = fillAnalytics
