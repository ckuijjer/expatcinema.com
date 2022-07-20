import { Context, APIGatewayEvent } from 'aws-lambda'

import scrapers from './scrapers'
import playground from './playground'
import notifySlack from './notifySlack'
import analytics from './analytics'
import fillAnalytics from './fillAnalytics'

const scrapersWrappedWithHTTP = async (
  event: APIGatewayEvent,
  context: Context,
) => {
  await scrapers(event, context)

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}

export {
  playground,
  notifySlack,
  analytics,
  fillAnalytics,
  scrapersWrappedWithHTTP as scrapers,
}
