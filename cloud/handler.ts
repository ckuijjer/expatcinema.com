import { APIGatewayEvent, Context } from 'aws-lambda'

import analytics from './analytics'
import fillAnalytics from './fillAnalytics'
import notifySlack from './notifySlack'
import playground from './playground'
import scrapers from './scrapers'

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
