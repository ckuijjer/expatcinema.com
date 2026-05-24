import camelcaseKeys from 'camelcase-keys'
import { RequestError, Response } from 'got'
import { Logger } from '@aws-lambda-powertools/logger'

import { logger as defaultLogger } from '../powertools'

export const camelcaseKeysHook = (response: any) => {
  response.body = camelcaseKeys(response.body, { deep: true })
  return response
}

export const logErrorHook = (logger: Logger = defaultLogger) =>
  (error: RequestError) => {
    logger.error(
      `Error retrieving ${error.options.url}: ${error.response?.statusCode} ${error.code} ${error.message}`,
    )
    return error
  }

export const logNonOkResponseHook = (logger: Logger = defaultLogger) =>
  (response: Response) => {
    if (response.statusCode >= 400) {
      logger.warn(
        `Non-ok response retrieving ${response.requestUrl}: ${response.statusCode}`,
      )
    }
    return response
  }
