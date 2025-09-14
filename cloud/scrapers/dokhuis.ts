import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { titleCase } from './utils/titleCase'
import { useLLM } from './utils/useLLM'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'dokhuis',
  },
})

const xray = Xray().concurrency(10).throttle(10, 300)

type XRayFromMoviePage = {
  content: string
  date: string
  time: string
}

const extractFromMoviePage = async ({
  url,
}: {
  url: string
}): Promise<Screening[]> => {
  const scrapeResult: XRayFromMoviePage = await xray(url, {
    content: '.text-content',
    date: '.information-container .date',
    time: '.information-container .time',
  })

  logger.info('scrapeResult', { scrapeResult })

  const { content, date, time } = scrapeResult

  const [dayString, monthString] = date.split(/\s+/)
  const day = Number(dayString)
  const month = shortMonthToNumberDutch(monthString)
  const [startTime, endTime] = time.split(/ - /)
  const { hour, minute } = DateTime.fromFormat(startTime, 'H:mm')

  const year = guessYear({
    day,
    month,
    hour,
    minute,
  })

  const prompt = `Extract the movie title, and reply with just the movie title from this text:\n\n ${content}`

  const title = titleCase(await useLLM(prompt))

  const screening = {
    title,
    url,
    cinema: 'Dokhuis',
    date: DateTime.fromObject({
      year,
      day,
      month,
      hour,
      minute,
    }).toJSDate(),
  }

  logger.info('extracted screening', { screening })

  return [screening]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  // note that the program might have more expat-friendly movies than this page, however there's no
  // easy way to go through the entire agenda
  const url = 'https://dokhuis.org/programma/'

  const xrayResult = await xray(url, '.events-items .event-item', [
    {
      title: '.event-title',
      url: 'a@href',
    },
  ])

  const movies = xrayResult
    .filter(({ url }) => url !== undefined) // remove movies without url (e.g. in the past)
    .filter(({ title }) =>
      title.toLowerCase().includes('movie night: acts of care'),
    ) // only events with "Movie Night: Acts of care" in the title have English subtitles

  logger.info('extracted', { movies })

  const screenings = (
    await Promise.all(movies.map(extractFromMoviePage))
  ).flat()

  logger.info('screenings', { screenings })

  return screenings
}

if (
  (typeof module === 'undefined' || module.exports === undefined) && // running in ESM
  import.meta.url === new URL(import.meta.url).href // running as main module, not importing from another module
) {
  //   extractFromMoviePage({
  //     url: 'https://dokhuis.org/programma/movie-night-acts-of-care-film-incl-maaltijd/',
  //   })

  extractFromMainPage()
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)
}

export default extractFromMainPage
