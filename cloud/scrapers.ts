import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'

import { logger as parentLogger } from './powertools'
import { scrapers } from './scrapers/index.ts'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'combined',
  },
})

export const handler = middy(scrapers).use(
  injectLambdaContext(logger, { clearState: true }),
)
