import camelcaseKeys from 'camelcase-keys'
import { RequestError } from 'got'
import { logger } from '../powertools'

export const camelcaseKeysHook = (response: any) => {
  response.body = camelcaseKeys(response.body, { deep: true })
  return response
}

export const logErrorHook = (error: RequestError) => {
  logger.warn(
    `Error retrieving ${error.options.url}: ${error.response?.statusCode} ${error.code} ${error.message}`,
  )
  return error
}
