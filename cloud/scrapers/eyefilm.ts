import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'

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

  // This is the query that the website uses to fetch the screenings, simply found by inspecting the network tab
  // in the browser.
  const query = gql`
    query shows(
      $siteId: [String]
      $search: String = null
      $productionType: Int = null
      $startDateTime: [QueryArgument]
      $label: [String] = null
      $productionThemeId: Int = null
      $language: String = null
      $limit: Int = 40
    ) {
      shows(
        site: $siteId
        productionThemeId: $productionThemeId
        productionType: $productionType
        search: $search
        startDateTime: $startDateTime
        label: $label
        language: $language
        limit: $limit
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
      limit: 1000, // by default the website only returns 40 results, and then when you scroll it loads more using e.g. offset: 40
    },
  })

  const hasEnglishSubtitles = (show) =>
    show.singleSubtitles === '42c27a5b-2d4e-4195-b547-cb6fbe9fcd49'

  logger.info('number of shows', results.data.shows.length)

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
