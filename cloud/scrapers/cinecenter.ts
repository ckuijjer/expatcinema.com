import got from 'got'
import { decode as decodeHtmlEntities } from 'html-entities'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'cinecenter',
  },
})

const ENG_SUBS_TAG_NAME = 'Eng Subs'
const ENG_SUBS_TITLE_PREFIX = /^Eng Subs:\s*/i

// Decode Astro's serialization format used in astro-island props:
// [0, value]     → primitive/object value
// [1, [...]]     → array (items recursively decoded)
// [3, isoString] → Date
const decodeAstro = (val: unknown): unknown => {
  if (val === null || typeof val !== 'object') return val
  if (Array.isArray(val)) {
    const [type, inner] = val as [number, unknown]
    if (type === 0) return decodeAstro(inner)
    if (type === 1) return (inner as unknown[]).map(decodeAstro)
    if (type === 3) return new Date(inner as string)
    return val
  }
  // Plain object — decode each value recursively
  return Object.fromEntries(
    Object.entries(val as Record<string, unknown>).map(([k, v]) => [
      k,
      decodeAstro(v),
    ]),
  )
}

type CinecenterScreening = {
  startAtUtc: Date
}

type CinecenterProduction = {
  title: string
  slug: string
  tags: Array<{ id: string; name: string }>
  screenings: CinecenterScreening[]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  logger.info('extracting main page')

  const html = await got('https://cinecenter.nl/films/').text()

  const islandMatch = html.match(/astro-island[^>]*\sprops="([^"]+)"/)
  if (!islandMatch) {
    logger.error('No astro-island props found, scraper is probably broken')
    return []
  }

  const propsStr = islandMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  const props = JSON.parse(propsStr)
  const productions = decodeAstro(props.productions) as CinecenterProduction[]

  logger.info('productions found', { count: productions.length })

  const screenings: Screening[] = productions
    .filter((p) => p.tags.some((t) => t.name === ENG_SUBS_TAG_NAME))
    .flatMap((p) => {
      const title = titleCase(
        decodeHtmlEntities(p.title.replace(ENG_SUBS_TITLE_PREFIX, '')),
      )
      const url = `https://cinecenter.nl/films/${p.slug}/`

      return p.screenings.map((s) => ({
        title,
        url,
        cinema: 'Cinecenter',
        date: s.startAtUtc,
      }))
    })

  logger.info('screenings', { screenings })

  return screenings
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage
