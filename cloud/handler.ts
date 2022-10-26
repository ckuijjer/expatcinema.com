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
}

export {
  playground,
  notifySlack,
  analytics,
  fillAnalytics,
  scrapersWrappedWithHTTP as scrapers,
}
