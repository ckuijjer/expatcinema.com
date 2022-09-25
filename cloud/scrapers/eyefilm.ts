import { DateTime } from 'luxon'
import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client'
import fetch from 'cross-fetch'

import { Screening } from '../types'
import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'eyefilm',
  },
})

const extractFromGraphQL = async (): Promise<Screening[]> => {
  const client = new ApolloClient({
    link: new HttpLink({ uri: 'https://www.eyefilm.nl/graphql', fetch }),
    cache: new InMemoryCache(),
  })

  const query = gql`
    query shows(
      $siteId: [String]
      $search: String = null
      $productionType: Int = null
      $startDateTime: [QueryArgument]
      $label: [String] = null
      $productionThemeId: Int = null
      $language: String = null
    ) {
      shows(
        site: $siteId
        productionThemeId: $productionThemeId
        productionType: $productionType
        search: $search
        startDateTime: $startDateTime
        label: $label
        language: $language
      ) {
        ... on show_show_Entry {
          url
          startDateTime
          endDateTime
          singleSubtitles
          production {
            title
          }
        }
      }
    }
  `

  const today = DateTime.now().startOf('day').toFormat('yyyy-MM-dd HH:mm')
  const oneMonthInTheFuture = DateTime.now()
    .plus({ months: 1 })
    .endOf('day')
    .toFormat('yyyy-MM-dd HH:mm')

  const results = await client.query({
    query,
    variables: {
      siteId: 'eyeEnglish',
      startDateTime: ['and', `> ${today}`, `< ${oneMonthInTheFuture}`],
    },
  })

  const hasEnglishSubtitles = (show) =>
    show.singleSubtitles === '42c27a5b-2d4e-4195-b547-cb6fbe9fcd49'

  const screenings = results.data.shows
    .filter(hasEnglishSubtitles)
    .map((show) => {
      return {
        title: show.production[0].title,
        url: show.url,
        cinema: 'Eye',
        date: new Date(show.startDateTime),
      }
    })

  return screenings
}

if (require.main === module) {
  extractFromGraphQL()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromGraphQL
