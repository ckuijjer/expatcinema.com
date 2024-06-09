import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { removeYearSuffix } from './utils/removeYearSuffix'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'melkweg',
  },
})

const xray = Xray({
  filters: {
    trimColon: (value) =>
      typeof value === 'string' ? value.replace(/:$/, '') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const extractFromMoviePage = async (screening: Screening) => {
  const data = await xray(
    screening.url,
    '[class^="styles_movie-meta-data__list-item"]',
    [
      {
        key: 'dt|trimColon',
        value: 'dd',
      },
    ],
  )

  const metadata = data.reduce((acc, { key, value }) => {
    acc[key] = value
    return acc
  }, {})

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

  const data = JSON.parse(await xray(url, '#__NEXT_DATA__'))
  const events =
    data.props.pageProps.pageData.attributes.content[0].attributes.initialEvents

  const unfilteredScreenings = events
    .filter((event) => event.attributes.profile === 'Film') // only movies
    .map((event): Screening => {
      return {
        title: cleanTitle(event.attributes.name),
        url: `https://www.melkweg.nl${event.attributes.url}`,
        date: DateTime.fromISO(event.attributes.startDate).toJSDate(),
        cinema: 'Melkweg',
      }
    })

  logger.info('unfilteredScreenings', { unfilteredScreenings })

  // the __NEXT_DATA__ of the page doesn't contain subtitle information, so we need to filter it out
  const screenings = (
    await Promise.all(unfilteredScreenings.map(extractFromMoviePage))
  ).filter((x) => x)

  logger.info('screenings', { screenings })
  return screenings
}

if (require.main === module) {
  // extractFromMoviePage({
  //   permalink: 'https://www.lux-nijmegen.nl/programma/coup-de-chance/',
  //   // 'https://www.lux-nijmegen.nl/programma/english-subs-perfect-days/',
  // })
  //   .then((x) => JSON.stringify(x, null, 2))
  //   .then(console.log)

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage
