import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DateTime, Settings } from 'luxon'

import documentClient from './documentClient'

Settings.defaultZone = 'Europe/Amsterdam'

const analytics = async ({ event, context } = {}) => {
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

  // convert to data points of the type type, createdAt, count, and scraper
  const dataPoints = data.Items?.flatMap(({ type, createdAt, ...rest }) =>
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
