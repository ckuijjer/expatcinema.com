import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { extractYearFromTitle } from './utils/extractYearFromTitle'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'kriterion',
  },
})

interface Show {
  id: number
  name: string
  code: string
  starts_at: string
  pre_show_duration: number
  post_show_duration: number
  theatre_id: number
  genre_id: number
  ticket_product_id: number
  category_id: number
  festival_id: number
  layout_id: number
  external_url: string | null
  content_actions: unknown | null
  mid_show_duration: number
  duration: number
  default_seat_category_id: number
  maccsbox_code: string
  maccsbox_contract: unknown | null
  maccsbox_show_type: unknown | null
  media_type: unknown | null
  digital_projection_type: unknown | null
  is_3d: boolean
  price_plan_id: number
  must_create_customer: boolean
  intro_duration: number
  extro_duration: number
  external_planner_id: unknown | null
  production_id: number
  is_for_cineville: boolean
  is_cineville_reservation_blocked: boolean
  customer_field_validators: unknown | null
  max_sellable_tickets: number
  wc_duration: number
  wc_extro_duration: number
  wc_festival_id: number
  wc_max_sellable_tickets: number
  wc_mid_show_duration: number
  wc_intro_duration: number
  wc_is_cineville_reservation_blocked: boolean
  wc_is_for_api: boolean
  wc_is_theatre_seated: boolean
  wc_post_show_duration: number
  wc_pre_show_duration: number
  wc_price_plan_id: number
  wc_ticket_product_id: number
  start_date: string
  start_time: string
  display_name: string
  theatre_name: string
  is_a_set: boolean
  ends_at: string
  updated_at: string
  customer_category_id: number
  has_sold_tickets: boolean
  has_reserved_or_sold_tickets: boolean
  is_theatre_seated: string
  genre_code: string
  is_deleted: string
  category_code: string
  extra_title_info: unknown | null
  director: string
  spoken_languages: unknown | null
  subtitle_languages: unknown | null
  spoken_languages_alt: unknown | null
  subtitle_languages_alt: unknown | null
  has_donation: string
  is_remote: string
  ticket_text_long: unknown | null
  ticket_text_short: unknown | null
  attachment_label: unknown | null
  attachment_url: unknown | null
  after_sales_message: unknown | null
}

interface KriterionShowsApiResponse {
  success: boolean
  shows: Show[]
}

interface KriterionFilmsApiResponse {
  [key: string]: number
}

interface KriterionCmsFilmApiResponse {
  data?: {
    attributes?: {
      jaar?: string
    }
  }
}

const hasEnglishSubtitles = (name: string) =>
  /\([^)]*eng subs[^)]*\)/i.test(name)

// Matches the entire parenthetical containing "eng subs", plus any leading whitespace.
// e.g. " (ENG subs)", " (1987, ENG subs)", " (ENG subs, 4K Restoration)"
const ENG_SUBS_PARENTHETICAL = /\s*\([^)]*eng subs[^)]*\)/i

const cleanTitle = (title: string) =>
  titleCase(title.trim().replace(ENG_SUBS_PARENTHETICAL, ''))

const extractCmsYear = async (slug: string) => {
  try {
    const response: KriterionCmsFilmApiResponse = await got(
      `https://testcms.kriterion.nl/api/films/${slug}?populate=*`,
    ).json()

    const match = response.data?.attributes?.jaar?.match(/\b((?:19|20)\d{2})\b/)

    return match?.[1] ? Number(match[1]) : undefined
  } catch (error) {
    logger.warn('failed to fetch cms film year', { slug, error })
    return undefined
  }
}

const extractFromMainPage = async () => {
  try {
    const showsApiResponse: KriterionShowsApiResponse = await got(
      'https://www.kriterion.nl/data/shows.json',
    ).json()

    const filmsApiResponse: KriterionFilmsApiResponse = await got(
      'https://www.kriterion.nl/data/films.json',
    ).json()

    logger.info('extracted api responses', {
      showsApiResponse,
      filmsApiResponse,
    })

    const productionIdToSlug = Object.entries(filmsApiResponse).reduce(
      (acc, [slug, productionId]) => {
        acc[productionId] = slug
        return acc
      },
      {} as { [key: number]: string },
    )

    const filteredShows = showsApiResponse.shows.filter((item) =>
      hasEnglishSubtitles(item.name),
    )

    const relevantSlugs = Array.from(
      new Set(
        filteredShows
          .map((item) => productionIdToSlug[item.production_id])
          .filter(Boolean),
      ),
    )

    const releaseYearBySlug = new Map<string, number | undefined>(
      await Promise.all(
        relevantSlugs.map(
          async (slug): Promise<[string, number | undefined]> => [
            slug,
            await extractCmsYear(slug),
          ],
        ),
      ),
    )

    const screenings: Screening[] = filteredShows
      .map((item) => {
        const slug = productionIdToSlug[item.production_id]
        const url = `https://kriterion.nl/films/${slug}`

        const screening: Screening = {
          title: cleanTitle(item.name),
          year: releaseYearBySlug.get(slug) ?? extractYearFromTitle(item.name),
          url,
          cinema: 'Kriterion',
          date: DateTime.fromISO(item.starts_at).toJSDate(),
        }
        return screening
      })
      .filter((screening) => {
        // filter out screenings without a url, and log them
        if (screening.url === undefined) {
          logger.warn('screening.url undefined', { screening })
          return false
        }

        return true
      })

    logger.info('extracted screenings', { screenings })
    return screenings
  } catch (error) {
    logger.error('error scraping kriterion', { error })
    return []
  }
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage
