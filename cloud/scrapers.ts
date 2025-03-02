import { APIGatewayEvent, Context } from 'aws-lambda'

import { handler as scrapers } from './scrapers/index.ts'

export const handler = async (event: APIGatewayEvent, context: Context) => {
  await scrapers(event, context)

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  }
}
