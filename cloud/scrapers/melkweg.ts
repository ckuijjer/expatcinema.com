import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'melkweg',
  },
})

const xray = Xray({
  filters: {
    trimColon: (value: unknown) =>
      typeof value === 'string' ? value.replace(/:$/, '') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

type MelkwegMetadataItem = {
  key: string
  value: string
}

type MelkwegEvent = {
  attributes: {
    profile: string
    name: string
    url: string
    startDate: string
  }
}

type MelkwegNextData = {
  props: {
    pageProps: {
      pageData: {
        attributes: {
          content: {
            attributes: {
              initialEvents: MelkwegEvent[]
            }
          }[]
        }
      }
    }
  }
}

const extractFromMoviePage = async (screening: Screening) => {
  const data = (await xray(
    screening.url,
    '[class^="styles_movie-meta-data__list-item"]',
    [
      {
        key: 'dt|trimColon',
        value: 'dd',
      },
    ],
  )) as MelkwegMetadataItem[]

  const metadata = data.reduce<Record<string, string>>(
    (acc, { key, value }) => {
      acc[key] = value
      return acc
    },
    {},
  )

  const hasEnglishSubtitles = metadata['Subtitles'] === 'EN'

  if (hasEnglishSubtitles) {
    return screening
  } else {
    return null
  }
}

const cleanTitle = (title: string) => {
  return titleCase(removeYearSuffix(title))
}

const extractFromMainPage = async () => {
  const url = 'https://www.melkweg.nl/en/agenda/'

  const data = JSON.parse(await xray(url, '#__NEXT_DATA__')) as MelkwegNextData
  const events =
    data.props.pageProps.pageData.attributes.content[0].attributes.initialEvents

  const unfilteredScreenings = events
    .filter((event: MelkwegEvent) => event.attributes.profile === 'Film') // only movies
    .map((event): Screening => {
      return {
        title: cleanTitle(event.attributes.name),
        year: extractYearFromTitle(event.attributes.name),
        url: `https://www.melkweg.nl${event.attributes.url}`,
        date: DateTime.fromISO(event.attributes.startDate).toJSDate(),
        cinema: 'Melkweg',
      }
    })

  logger.info('unfilteredScreenings', { unfilteredScreenings })

  // the __NEXT_DATA__ of the page doesn't contain subtitle information, so we need to filter it out
  const screenings = (
    await Promise.all(unfilteredScreenings.map(extractFromMoviePage))
  ).filter((x): x is Screening => x !== null)

  logger.info('screenings', { screenings })
  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage
