import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { guessYear } from './utils/guessYear'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'filmhuisdespiegel',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value: unknown) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})
  .concurrency(10)
  .throttle(10, 300)

const hasEnglishSubtitles = (infoParagraph: string) =>
  /Ondertitel:\s*Engels/i.test(infoParagraph)

// Shows are formatted like "Wo. 13 Mei / 14:00 uur"
const parseShowDate = (text: string): Date | null => {
  const match = text.match(/(\d{1,2})\s+(\w+)\s*\/\s*(\d{1,2}):(\d{2})\s*uur/i)
  if (!match) return null

  const [, dayStr, monthStr, hourStr, minuteStr] = match
  const day = Number(dayStr)
  const month = monthToNumber(monthStr)
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  const year = guessYear({ day, month, hour, minute })

  return DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: 'Europe/Amsterdam' },
  ).toJSDate()
}

type XRayFilmCard = {
  url: string
  title: string
  infoParagraph: string
  shows: string[]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const cards: XRayFilmCard[] = await xray(
    'https://filmhuisdespiegel.nl/programma/',
    '.card.voorstelling',
    [
      {
        url: 'a@href',
        title: 'h3.title span | trim',
        infoParagraph: 'p | normalizeWhitespace | trim',
        shows: ['ul.shows li a | normalizeWhitespace | trim'],
      },
    ],
  )

  logger.info('film cards', { numberOfCards: cards.length })

  const screenings = cards
    .filter((card) => card.url && card.title && hasEnglishSubtitles(card.infoParagraph))
    .flatMap((card) => {
      const title = titleCase(card.title)
      const dates = card.shows
        .map(parseShowDate)
        .filter((date): date is Date => date !== null)

      if (dates.length === 0) {
        logger.warn('skipping film card with no parseable show dates', {
          url: card.url,
        })
        return []
      }

      return dates.map((date) => ({
        title,
        url: card.url,
        cinema: 'Filmhuis De Spiegel',
        date,
      }))
    })

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage
