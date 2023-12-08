import Xray from 'x-ray'
import got from 'got'
import { Screening } from 'types'
import { DateTime } from 'luxon'

import guessYear from './utils/guessYear'
import { logger as parentLogger } from '../powertools'
import { fullMonthToNumberEnglish } from './utils/monthToNumber'
import splitTime from './utils/splitTime'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'lux',
  },
})

const xray = Xray({
  filters: {
    trim: (value) => (typeof value === 'string' ? value.trim() : value),
  },
})
  .concurrency(10)
  .throttle(10, 300)

type XRayFromMoviePage = {
  title: string
  screenings: {
    date: string
    times: string[]
  }[]
}

const cleanTitle = (title: string) => title.replace(/^English Subs [–-] /i, '') // remove subs from the title using two different dashes

const splitFirstDate = (date: string) => {
  if (date === 'Vandaag') {
    const { day, month, year } = DateTime.now()
    return { day, month, year }
  } else if (date === 'Morgen') {
    const { day, month, year } = DateTime.now().plus({ days: 1 })
    return { day, month, year }
  } else {
    // b.v. ma 11.12
    const [dayOfWeek, dayString, monthString] = date.split(/ |\./) // space or dot

    const day = Number(dayString)
    const month = Number(monthString)

    return { day, month }
  }
}

const extractFromMoviePage = async ({
  title,
  permalink: url,
}: MainPageResponse['items'][0]) => {
  // url example 'https://www.lux-nijmegen.nl/programma/english-subs-perfect-days/'

  const data: XRayFromMoviePage = await xray(url, 'body', {
    title: 'h2.header-programme__title  | trim',
    screenings: xray('.programme-tickets-popup__day', [
      {
        date: '.programme-tickets-popup__label | trim',
        times: ['.component-times__inner | trim'],
      },
    ]),
  })

  const screenings: Screening[] = data.screenings.flatMap(({ date, times }) => {
    let { day, month, year } = splitFirstDate(date)
    year = guessYear({ day, month, year })

    return times.flatMap((time) => {
      const [hour, minute] = splitTime(time)

      return {
        title: cleanTitle(data.title),
        url,
        cinema: 'Lux',
        date: DateTime.fromObject({
          day,
          month,
          hour,
          minute,
          year,
        }).toJSDate(),
      }
    })
  })

  logger.info({ screenings })
  return screenings
}

type MainPageResponse = {
  items: {
    id: number
    title: string
    permalink: string
  }[]
}

const extractFromMainPage = async () => {
  const response: MainPageResponse = await got(
    'https://www.lux-nijmegen.nl/wp-json/lux/v1/discover',
    {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-key':
          '{"types":[],"genres":[122],"tags":[],"search":"","isVerwacht":false}',
        'content-type': 'application/json',
      },
      body: '{"types":[],"genres":[122],"tags":[],"search":"","isVerwacht":false}',
      method: 'POST',
    },
  ).json()

  logger.info('main page', { response })

  const screenings = (
    await Promise.all(response.items.map(extractFromMoviePage))
  ).flat()

  logger.info('main page', { screenings })

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
