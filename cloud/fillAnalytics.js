// Used for the initial filling of the analytics DynamoDB table based on the contents of the scrapers S3 bucket

const AWS = require('aws-sdk')
const { inspect } = require('util')
const pMap = require('p-map')

const documentClient = require('./documentClient')

const s3 = new AWS.S3()

const PRIVATE_BUCKET = 'expatcinema-scrapers-output'

// https://stackoverflow.com/a/57540786/65971
async function* listAllKeys(opts) {
  opts = { ...opts }
  do {
    const data = await s3.listObjectsV2(opts).promise()
    opts.ContinuationToken = data.NextContinuationToken
    yield data
  } while (opts.ContinuationToken)
}

const getAllKeysFromS3 = async () => {
  const keys = []
  for await (const data of listAllKeys({ Bucket: PRIVATE_BUCKET })) {
    keys.push(...data.Contents.map((x) => x.Key))
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
  const params = {
    TableName: process.env.DYNAMODB_ANALYTICS,
    Item: {
      type: 'count',
      ...data,
    },
  }
  return await documentClient.put(params).promise()
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
  const params = {
    Bucket: PRIVATE_BUCKET,
    Key: key,
  }

  const data = await s3.getObject(params).promise()
  const body = data.Body.toString()
  const json = JSON.parse(body)

  return json
}

exports.fillAnalytics = fillAnalytics
