import got from 'got'
import camelcaseKeys from 'camelcase-keys'

const USER_AGENT: string = 'expatcinema.com'

const getClient = () => {
  return got.extend({
    prefixUrl: 'https://api.duckduckgo.com',
    searchParams: {
      format: 'json',
      t: USER_AGENT,
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
