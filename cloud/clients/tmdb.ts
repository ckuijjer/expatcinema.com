import got from 'got'

import { camelcaseKeysHook, logErrorHook } from './gotHooks'

const getClient = (apiKey: string) => {
  return got.extend({
    prefixUrl: 'https://api.themoviedb.org/3',
    searchParams: {
      api_key: apiKey,
    },
    retry: {
      limit: 3,
      methods: ['GET'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
      calculateDelay: ({ computedValue, error, retryAfter }) => {
        if (retryAfter) {
          return retryAfter
        }

        const statusCode = error.response?.statusCode
        if (statusCode === 429) {
          return Math.max(computedValue, 2_000)
        }

        return computedValue
      },
    },
    responseType: 'json', // to have json parsing
    resolveBodyOnly: true, // to have the response only contain the body, not the entire response, got internal things etc
    hooks: {
      afterResponse: [camelcaseKeysHook],
      beforeError: [logErrorHook],
    },
  })
}

export default getClient
