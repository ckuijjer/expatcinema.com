import { DateTime } from 'luxon'
import got from 'got'

import { Screening } from '../types'
import splitTime from './splitTime'

import { logger as parentLogger } from '../powertools'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdenhaag',
  },
})

type FilmhuisDenhaagAPIResponse = {
  data: {
    id: number
    starts_at_time: string
    starts_at_date: string
    genre: string
    availability: string
    tickets_left: number
    ticket_url: string
    location: string
    expected: number
    additional_title: string
    information: string
    online: number
    film: {
      title: string
      image: string
      description: string
      director: string
      duration: string
      location: string
      subtitle: string
      uri: string
      theme: string
      theme_color: string
      category: string[]
    }
  }[]
}

const cleanTitle = (title: string) => title.replace(/ – EN subs$/, '')

const extractFromMainPage = async (): Promise<Screening[]> => {
  const apiResponse: FilmhuisDenhaagAPIResponse = await got(
    'https://filmhuisdenhaag.nl/api/program',
  ).json()

  logger.info('extracted api response', { apiResponse })

  const screenings: Screening[] = apiResponse.data
    .filter(
      (item) =>
        item.film.subtitle === 'Engels' || item.film.subtitle === 'English',
    )
    .map((item) => {
      const [year, month, day] = item.starts_at_date
        .split('-')
        .map((x) => Number(x))
      const [hour, minute] = splitTime(item.starts_at_time)

      return {
        title: cleanTitle(item.film.title),
        url: `https://filmhuisdenhaag.nl${item.film.uri}`,
        cinema: 'Filmhuis Den Haag',
        date: DateTime.fromObject({
          year,
          month,
          day,
          hour,
          minute,
        }).toJSDate(),
      }
    })

  logger.info('extracted screenings', { screenings })
  return screenings
}

if (require.main === module) {
  const sort = R.sortWith([
    (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
    R.ascend(R.prop('cinema')),
    R.ascend(R.prop('title')),
    R.ascend(R.prop('url')),
  ])

  extractFromMainPage()
    .then(sort)
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  // url: 'https://www.filmhuisdenhaag.nl/agenda/event/styx',
  // }).then(console.log)
}

export default extractFromMainPage
