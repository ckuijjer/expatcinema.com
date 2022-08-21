import got from 'got'
import camelcaseKeys from 'camelcase-keys'

const getClient = (apiKey: string) => {
  return got.extend({
    prefixUrl: 'https://api.themoviedb.org/3',
    searchParams: {
      api_key: apiKey,
    },
    responseType: 'json', // to have json parsing
    resolveBodyOnly: true, // to have the response only contain the body, not the entire response, got internal things etc
    hooks: {
      afterResponse: [
        (response: any) => {
          response.body = camelcaseKeys(response.body, { deep: true })
          return response
        },
      ],
    },
  })
}

export default getClient
