import got from 'got'
import { decode } from 'html-entities'
import { DateTime } from 'luxon'
import Xray from 'x-ray'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { monthToNumber } from './utils/monthToNumber'
import { runIfMain } from './utils/runIfMain'
import { splitTime } from './utils/splitTime'
import { titleCase } from './utils/titleCase'
import { useLLM } from './utils/useLLM'
import { trim } from './utils/xrayFilters'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'debalie',
  },
})

const xray = Xray({
  filters: {
    trim,
    normalizeWhitespace: (value) =>
      typeof value === 'string' ? value.replace(/\s+/g, ' ') : value,
  },
})

const CURRENT_MOVIES_URL =
  'https://debalie.nl/wp-json/wp/v2/vo-cinema?page=1&per_page=100&_fields=link,title'

type CurrentMovieSummary = {
  link: string
  title: {
    rendered: string
  }
}

const extractCurrentMovieUrls = async () => {
  const movies = await got(CURRENT_MOVIES_URL).json<CurrentMovieSummary[]>()

  return Array.from(
    new Set(
      movies
        .map(({ link }) => link)
        .filter((link): link is string => Boolean(link)),
    ),
  )
}

const extractTitle = (title: string) => {
  const match = decode(title).match(
    /(.*?)(?:,\s*een film in De Balie|\s*-\s*De Balie)?$/i,
  )
  return match?.[1] ? titleCase(match[1].trim()) : null
}

const extractPageYear = (html: string) => {
  const match = html.match(/"datePublished":"(\d{4})-\d{2}-\d{2}/)
  return match?.[1] ? Number(match[1]) : DateTime.now().year
}

const parseTicketDateFromTicketUrl = (
  url: string,
  time: string,
  year: number,
) => {
  const match = url.match(/-(\d{1,2})-([a-z]{3})-\d+\/?$/i)
  if (!match) return null

  const day = Number(match[1])
  const month = monthToNumber(match[2])
  const [hour, minute] = splitTime(time)

  return DateTime.fromObject({
    year,
    month,
    day,
    hour,
    minute,
  }).toJSDate()
}

const parseTicketDateFromSelectorDay = (selectorDay: string, time: string) => {
  if (!/^\d{8}$/.test(selectorDay)) return null

  return DateTime.fromFormat(`${selectorDay} ${time}`, 'yyyyLLdd HH:mm', {
    zone: 'Europe/Amsterdam',
  }).toJSDate()
}

type XRayDetailPage = {
  bodyText: string
  markTexts: string[]
  subtitleInfoItems: string[]
  tickets: {
    selectorDay?: string
    url: string
    time: string
  }[]
  title: string
}

type SubtitleDecision = {
  englishSubtitles: boolean
  index: number
}

type ScreeningCandidate = Screening & {
  index: number
}

const extractTicketLinks = (page: XRayDetailPage) =>
  page.tickets.flatMap(({ url, selectorDay, time }) => {
    if (!url || !time) {
      return []
    }

    return [
      {
        url: new URL(url, 'https://debalie.nl').toString(),
        selectorDay: selectorDay ?? null,
        time,
      },
    ]
  })

const extractScreeningDate = (
  url: string,
  selectorDay: string | null,
  time: string,
  year: number,
) =>
  selectorDay
    ? parseTicketDateFromSelectorDay(selectorDay, time)
    : parseTicketDateFromTicketUrl(url, time, year)

const hasUniversalEnglishSubtitles = (page: XRayDetailPage) =>
  page.subtitleInfoItems.some((text) =>
    /ondertitels?.*english|english.*ondertitels?|with english subtitles|engels/i.test(
      text,
    ),
  )

const extractSubtitleNotes = (page: XRayDetailPage) =>
  Array.from(
    new Set(
      [...page.subtitleInfoItems, ...page.markTexts, page.bodyText].filter(
        (text) => /subtitles?|ondertitels?|english|engels/i.test(text),
      ),
    ),
  )

const parseSubtitleDecisions = (response: string) => {
  const match = response.match(/\[[\s\S]*\]/)
  if (!match?.[0]) return null

  try {
    const parsed = JSON.parse(match[0]) as SubtitleDecision[]
    return new Set(
      parsed
        .filter(
          (item): item is SubtitleDecision =>
            typeof item?.index === 'number' && item.englishSubtitles === true,
        )
        .map((item) => item.index),
    )
  } catch {
    return null
  }
}

const filterScreeningsWithLLM = async (
  subtitleNotes: string[],
  screenings: ScreeningCandidate[],
) => {
  const prompt = [
    'You are filtering cinema screenings for English subtitles.',
    '',
    'Subtitle notes from the page:',
    ...subtitleNotes.map((note) => `- ${note}`),
    '',
    'Screenings:',
    ...screenings.map((screening) => {
      const localDate = DateTime.fromJSDate(screening.date, {
        zone: 'Europe/Amsterdam',
      })

      return `${screening.index}. ${screening.title} | ${localDate.toFormat(
        'cccc yyyy-LL-dd HH:mm',
      )}`
    }),
    '',
    'Return only valid JSON in this exact shape:',
    '[{"index":1,"englishSubtitles":true}]',
    'Include one object per screening that has English subtitles.',
    'It is valid to return an empty array if none of the screenings have English subtitles.',
    'Use the screening list order above.',
  ].join('\n')

  const response = await useLLM(prompt)
  logger.info('LLM response for subtitle filtering', {
    subtitleNotes,
    response,
  })
  const indices = parseSubtitleDecisions(response)

  if (!indices) {
    logger.warn('could not parse subtitle decisions from LLM', {
      response,
      subtitleNotes,
    })
    return new Set<number>()
  }

  return indices
}

const extractFromDetailPage = async (url: string): Promise<Screening[]> => {
  let html: string
  try {
    html = await got(url).text()
  } catch (error) {
    logger.warn('skipping page that could not be fetched', { url, error })
    return []
  }

  const page: XRayDetailPage = await xray(html, {
    bodyText: '.entry__content@text | normalizeWhitespace | trim',
    markTexts: xray('mark', ['@text | normalizeWhitespace | trim']),
    subtitleInfoItems: xray('.wp-block-vo-info-item', [
      '@text | normalizeWhitespace | trim',
    ]),
    tickets: xray('[data-ticket-selector-day]', [
      {
        selectorDay: '@data-ticket-selector-day | trim',
        url: '.banner-bar__link@href | trim',
        time: '.banner-bar__link | trim',
      },
    ]),
    title: 'title | trim',
  })

  const title = extractTitle(page.title)
  if (!title) return []
  const year = extractPageYear(html)

  const ticketLinks = extractTicketLinks(page)
  if (ticketLinks.length === 0) {
    return []
  }

  const screenings = ticketLinks
    .map(({ url: ticketUrl, selectorDay, time }) => ({
      title,
      url,
      cinema: 'De Balie',
      date: extractScreeningDate(ticketUrl, selectorDay, time, year),
    }))
    .filter((screening): screening is Screening => screening.date !== null)

  if (hasUniversalEnglishSubtitles(page)) {
    return screenings
  }

  const subtitleNotes = extractSubtitleNotes(page)
  if (subtitleNotes.length === 0) {
    return []
  }

  const screeningCandidates: ScreeningCandidate[] = screenings.map(
    (screening, index) => ({
      ...screening,
      index: index + 1,
    }),
  )

  const englishSubtitleIndices = await filterScreeningsWithLLM(
    subtitleNotes,
    screeningCandidates,
  )

  if (englishSubtitleIndices.size === 0) {
    return []
  }

  return screeningCandidates
    .filter(({ index }) => englishSubtitleIndices.has(index))
    .map(({ index: _index, ...screening }) => screening)
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const urls = await extractCurrentMovieUrls()

  logger.info('detail urls', { numberOfUrls: urls.length })

  const screenings = (await Promise.all(urls.map(extractFromDetailPage))).flat()

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage
