import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { shortMonthToNumberDutch } from './utils/monthToNumber'
import { extractScreeningsFromPages } from './utils/extractScreeningsFromPages'
import { titleCase } from './utils/titleCase'
import { useLLM } from './utils/useLLM'
import { createXray } from '../xRay'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'dokhuis',
  },
})

const xray = createXray({ logger })

type XRayFromMoviePage = {
  content: string
  date: string
  time: string
}

type DokhuisMovie = {
  title?: string
  url?: string
}

const hasEnglishSubtitles = (content?: string) =>
  /engelse ondertitel|english subtitle|english subs|eng subs/i.test(
    content ?? '',
  )

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

  logger.debug('scrapeResult', { scrapeResult })

  const { content, date, time } = scrapeResult

  if (!hasEnglishSubtitles(content)) {
    logger.debug('no English subtitles', { url })
    return []
  }

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

  logger.debug('extracted screening', { screening })

  return [screening]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  // note that the program might have more expat-friendly movies than this page, however there's no
  // easy way to go through the entire agenda
  const url = 'https://dokhuis.org/programma/'

  const xrayResult = (await xray(url, '.events-items .event-item', [
    {
      title: '.event-title',
      url: 'a@href',
    },
  ])) as DokhuisMovie[]

  const movies = xrayResult
    .filter((item): item is DokhuisMovie & { url: string; title: string } =>
      Boolean(item.url && item.title),
    ) // remove movies without url (e.g. in the past)
    // Dokhuis programmes film nights from several series (e.g. NIVOZ
    // Filmavond, IFFR Filmclub); only some are shown with English subtitles,
    // which extractFromMoviePage checks in the event description.
    .filter(({ title }) => /film|movie/i.test(title))

  logger.debug('extracted', { movies })

  const screenings = await extractScreeningsFromPages(
    movies,
    extractFromMoviePage,
    { logger, url: ({ url }) => url },
  )

  logger.debug('screenings', { screenings })

  return screenings
}

export default extractFromMainPage
