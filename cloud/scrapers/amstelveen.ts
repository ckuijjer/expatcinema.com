import got from 'got'
import { DateTime } from 'luxon'

import { logger as parentLogger } from '../powertools'
import { Screening } from '../types'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import { runIfMain } from './utils/runIfMain'
import { titleCase } from './utils/titleCase'

const logger = parentLogger.createChild({
  persistentLogAttributes: {
    scraper: 'amstelveen',
  },
})

type Show = {
  Start: string
  Production: {
    Title: string
    SubTitle?: string
    Url: string
  }
}

type ApiResponse = {
  Data: Show[]
}

const hasEnglishSubtitles = (show: Show) =>
  (show.Production.SubTitle ?? '').toLowerCase().includes('english subtitles')

const extractFromMainPage = async (): Promise<Screening[]> => {
  const apiResponse: ApiResponse = await got(
    'https://schouwburgamstelveen.nl/umbraco/api/Search/GetShows',
    {
      searchParams: {
        lang: 'nl',
        productiontypes: 'cinema',
        Limit: 200,
      },
    },
  ).json()

  logger.info('api response', { numberOfShows: apiResponse.Data.length })

  const screenings = apiResponse.Data.filter(hasEnglishSubtitles).map((show) => ({
    title: titleCase(show.Production.Title),
    url: show.Production.Url,
    cinema: 'Cinema Amstelveen',
    date: DateTime.fromISO(show.Start, {
      zone: 'Europe/Amsterdam',
    }).toJSDate(),
  }))

  return makeScreeningsUniqueAndSorted(screenings)
}

runIfMain(extractFromMainPage, import.meta.url)

export default extractFromMainPage
