import { APIGatewayEvent, Context } from 'aws-lambda'

import { handler as analytics } from './analytics'
import { handler as fillAnalytics } from './fillAnalytics'
import { handler as notifySlack } from './notifySlack'
import { handler as playground } from './playground'
import { handler as scrapers } from './scrapers/index.ts'

const scrapersWrappedWithHTTP = async (
  event: APIGatewayEvent,
  context: Context,
) => {
  await scrapers(event, context)

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Running scrapers is done!',
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
