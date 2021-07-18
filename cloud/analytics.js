const { DateTime, Settings } = require('luxon')
const documentClient = require('./documentClient')

Settings.defaultZone = 'Europe/Amsterdam'

const analytics = async ({ event, context } = {}) => {
  const twoWeeksAgo = DateTime.now().minus({ weeks: 2 }).startOf('day').toISO()

  const results = await documentClient
    .query({
      TableName: process.env.DYNAMODB_ANALYTICS,
      KeyConditionExpression: '#type = :type and createdAt >= :createdAt',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'count',
        ':createdAt': twoWeeksAgo,
      },
    })
    .promise()

  return {
    statusCode: 200,
    body: JSON.stringify(results.Items, null, 2),
  }
}

exports.analytics = analytics
