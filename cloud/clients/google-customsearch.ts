import got from 'got'
import camelcaseKeys from 'camelcase-keys'

type Options = {
  customSearchId: string
  apiKey: string
}

const getClient = ({ customSearchId, apiKey }: Options) => {
  return got.extend({
    prefixUrl: 'https://www.googleapis.com/customsearch/v1',
    searchParams: {
      cx: customSearchId,
      key: apiKey,
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
