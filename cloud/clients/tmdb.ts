import got from 'got'
import { camelcaseKeysHook, logErrorHook } from './gotHooks'

const getClient = (apiKey: string) => {
  return got.extend({
    prefixUrl: 'https://api.themoviedb.org/3',
    searchParams: {
      api_key: apiKey,
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
