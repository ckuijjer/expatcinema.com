import got from 'got'
import camelcaseKeys from 'camelcase-keys'
import { camelcaseKeysHook, logErrorHook } from './utils'

const getClient = (apiKey: string) => {
  return got.extend({
    prefixUrl: 'https://www.omdbapi.com',
    searchParams: {
      apikey: apiKey,
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
