import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { mkdir, writeFile } from 'fs/promises'
import { DateTime, Settings } from 'luxon'
import pMap from 'p-map'
import { dirname, resolve } from 'path'

import { closeBrowser } from '../browser'
import documentClient from '../documentClient'
import getMetadata from '../metadata'
import { logger } from '../powertools'
import { Screening } from '../types'
import bioscopenleiden from './bioscopenleiden'
import chasse from './chasse'
import cinecenter from './cinecenter'
import cinecitta from './cinecitta'
import cinemadevlugt from './cinemadevlugt'
import cinerama from './cinerama'
import concordia from './concordia'
import desien from './desien'
import dewittdordrecht from './dewittdordrecht'
import defilmhallen from './defilmhallen'
import deuitkijk from './deuitkijk'
import dokhuis from './dokhuis'
import eyefilm from './eyefilm'
import fchyena from './fchyena'
import filmhuisdenhaag from './filmhuisdenhaag'
import filmhuislumen from './filmhuislumen'
import filmkoepel from './filmkoepel'
import florafilmtheater from './florafilmtheater'
import focusarnhem from './focusarnhem'
import forumgroningen from './forumgroningen'
import hartlooper from './hartlooper'
import hetdocumentairepaviljoen from './hetdocumentairepaviljoen'
import ketelhuis from './ketelhuis'
import kinorotterdam from './kinorotterdam'
import kriterion from './kriterion'
import lab1 from './lab1'
import lab111 from './lab111'
import lantarenvenster from './lantarenvenster'
import lumiere from './lumiere'
import lux from './lux'
import melkweg from './melkweg'
import natlab from './natlab'
import rialto from './rialto'
import schuur from './schuur'
import slachtstraat from './slachtstraat'
import springhaver from './springhaver'
import studiok from './studiok'
import themovies from './themovies'
import { makeScreeningsUniqueAndSorted } from './utils/makeScreeningsUniqueAndSorted'
import {
  getMetadataLookupKey,
  normalizeMovieTitleForLookup,
} from '../metadata/titleResolver'

const SCRAPERS = {
  bioscopenleiden,
  chasse,
  cinecenter,
  cinecitta,
  cinemadevlugt,
  cinerama,
  concordia,
  desien,
  dewittdordrecht,
  defilmhallen,
  deuitkijk,
  dokhuis,
  eyefilm,
  fchyena,
  filmhuisdenhaag,
  filmhuislumen,
  filmkoepel,
  florafilmtheater, // uses puppeteer
  focusarnhem, // uses puppeteer
  forumgroningen,
  hartlooper,
  hetdocumentairepaviljoen,
  ketelhuis, // uses puppeteer
  kinorotterdam,
  kriterion,
  lab1,
  lab111, // uses puppeteer
  lantarenvenster,
  lumiere, // uses puppeteer
  lux,
  melkweg,
  natlab,
  rialto,
  schuur, // uses puppeteer
  slachtstraat,
  springhaver,
  studiok,
  themovies,
}

// Set the default timezone to Europe/Amsterdam, otherwise AWS Lambda will scrape as UTC and running it locally
// as Europe/Amsterdam
Settings.defaultZone = 'Europe/Amsterdam'

const s3Client = new S3Client({})

const PRIVATE_BUCKET = process.env.PRIVATE_BUCKET
const PUBLIC_BUCKET = process.env.PUBLIC_BUCKET

const now = DateTime.fromObject({}).toUTC().toISO()

const writeToFileInBucket =
  (bucket: string) => (filename: string) => async (data: object) => {
    const dataJson = JSON.stringify(data, null, 2)

    if (process.env.IS_LOCAL) {
      const path = `./output/${bucket}/${filename}`
      logger.info('writing local file', {
        bucket,
        filename,
        path: resolve(path),
      })
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, dataJson)
    } else {
      const params = {
        Bucket: bucket,
        Key: filename,
        Body: dataJson,
      }
      return s3Client.send(new PutObjectCommand(params))
    }
  }

const writeToFile = writeToFileInBucket(PRIVATE_BUCKET)
const writeToPublicFile = writeToFileInBucket(PUBLIC_BUCKET)

const writeToAnalytics =
  (type: string) => async (fields: Record<string, unknown>) => {
    if (process.env.IS_LOCAL) {
      const path = `./output/analytics/${type}.json`
      logger.info('writing local analytics file', {
        type,
        path: resolve(path),
      })
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, JSON.stringify(fields, null, 2))
    } else {
      const putCommand = new PutCommand({
        TableName: process.env.DYNAMODB_ANALYTICS,
        Item: {
          type,
          createdAt: now,
          ...fields,
        },
      })

      return await documentClient.send(putCommand)
    }
  }

const getEnabledScrapers = () => {
  if (process.env.SCRAPERS) {
    return Object.fromEntries(
      Object.entries(SCRAPERS).filter(([name, fn]) => {
        return process.env.SCRAPERS?.split(',').includes(name)
      }),
    )
  }

  return SCRAPERS
}

export const scrapers = async () => {
  try {
    const ENABLED_SCRAPERS = getEnabledScrapers()

    logger.info('available scrapers', { SCRAPERS: Object.keys(SCRAPERS) })
    logger.info('enabled scrapers', {
      ENABLED_SCRAPERS: Object.keys(ENABLED_SCRAPERS),
    })
    logger.info('number of scrapers', {
      numberOfAvailableScrapers: Object.keys(SCRAPERS).length,
      numberOfEnabledScrapers: Object.keys(ENABLED_SCRAPERS).length,
    })

    const results = Object.fromEntries(
      await Promise.all(
        Object.entries(ENABLED_SCRAPERS).map(async ([name, fn]) => {
          logger.info('start scraping', { scraper: name })

          // call the scraper function
          let result: Screening[] = []
          try {
            result = await fn()
          } catch (error) {
            logger.error('error scraping (scrapers Promise.all loop)', {
              scraper: name,
              error,
            })
          }

          logger.info('done scraping', {
            scraper: name,
            numberOfResults: result?.length,
          })

          return [name, makeScreeningsUniqueAndSorted(result)]
        }),
      ),
    ) as Record<string, Screening[]>

    // close the browser
    try {
      await closeBrowser({ logger })
    } catch (error) {
      logger.warn('failed closing browser', { error })
    }

    logger.info('done scraping for all scrapers')

    const allRawScreenings = makeScreeningsUniqueAndSorted(
      Object.values(results).flat(),
    )

    const metadataLookups = new Map<
      string,
      { query: string; year?: number; rawTitles: Set<string> }
    >()
    allRawScreenings.forEach(({ title, year }) => {
      const query = normalizeMovieTitleForLookup(title)
      const lookupKey = getMetadataLookupKey(title, year)
      const existingLookup = metadataLookups.get(lookupKey) ?? {
        query,
        year,
        rawTitles: new Set<string>(),
      }
      existingLookup.rawTitles.add(title)
      metadataLookups.set(lookupKey, existingLookup)
    })

    const uniqueTitlesAndMetadata = await pMap(
      Array.from(metadataLookups.values())
        .sort((left, right) => {
          const leftRawTitle = Array.from(left.rawTitles)[0] ?? ''
          const rightRawTitle = Array.from(right.rawTitles)[0] ?? ''
          return leftRawTitle.localeCompare(rightRawTitle)
        })
        .map((lookup) => ({
          title: Array.from(lookup.rawTitles)[0] ?? '',
          year: lookup.year,
        })),
      getMetadata,
      {
        concurrency: 5,
      },
    )

    const allWithResolvedMovies = makeScreeningsUniqueAndSorted(
      allRawScreenings.map((movie) => {
        const lookupKey = getMetadataLookupKey(movie.title, movie.year)
        const metadata = uniqueTitlesAndMetadata.find(
          (entry) =>
            getMetadataLookupKey(entry.query, entry.year) === lookupKey,
        )

        return {
          ...movie,
          movieId: metadata?.movieId,
        }
      }),
    )

    const movies = Array.from(
      new Map(
        uniqueTitlesAndMetadata
          .filter((metadata) => metadata.movieId && metadata.tmdb?.id)
          .map((metadata) => [
            metadata.movieId,
            {
              movieId: metadata.movieId,
              tmdbId: metadata.tmdb?.id,
              imdbId: metadata.imdbId,
              title: metadata.title,
              tmdb: {
                id: metadata.tmdb?.id,
                title: metadata.title,
                originalTitle: metadata.originalTitle,
                releaseDate: metadata.tmdb?.releaseDate,
                posterPath: metadata.tmdb?.posterPath,
                backdropPath: metadata.tmdb?.backdropPath,
                overview: metadata.tmdb?.overview,
                originalLanguage: metadata.tmdb?.originalLanguage,
                voteAverage: metadata.tmdb?.voteAverage,
                genreIds: metadata.tmdb?.genreIds ?? [],
              },
            },
          ]),
      ).values(),
    )

    const toTitleMatchRecord = (metadata) => ({
      query: metadata.query,
      year: metadata.year,
      titleRaw: Array.from(
        metadataLookups.get(getMetadataLookupKey(metadata.query, metadata.year))
          ?.rawTitles ?? [],
      )[0],
      titleRawVariants: Array.from(
        metadataLookups.get(getMetadataLookupKey(metadata.query, metadata.year))
          ?.rawTitles ?? [],
      ),
      movieId: metadata.movieId,
      title: metadata.title,
      originalTitle: metadata.originalTitle,
      imdbId: metadata.imdbId,
      tmdbId: metadata.tmdb?.id,
      match: metadata.match,
    })

    const titleMatches = uniqueTitlesAndMetadata.map(toTitleMatchRecord)

    const ambiguousMovies = uniqueTitlesAndMetadata
      .filter((metadata) => metadata.match.status === 'ambiguous')
      .map(toTitleMatchRecord)

    const unmatchedMovies = uniqueTitlesAndMetadata
      .filter((metadata) => metadata.match.status === 'unmatched')
      .map(toTitleMatchRecord)

    const privateResults = {
      ...results,
      all: allWithResolvedMovies,
    }

    logger.info('writing all to private S3 bucket')
    await Promise.all(
      Object.entries(privateResults).map(
        async ([name, data]) => await writeToFile(`${name}/${now}.json`)(data),
      ),
    )

    await writeToFile(`review/ambiguous-movies/${now}.json`)(ambiguousMovies)
    await writeToFile(`review/unmatched-movies/${now}.json`)(unmatchedMovies)

    logger.info('writing all, the combined json, to public S3 bucket')
    await writeToPublicFile('screenings.json')(allWithResolvedMovies)
    await writeToPublicFile('movies.json')(movies)
    await writeToPublicFile('title-matches.json')(titleMatches)

    const countPerScraper = Object.fromEntries(
      Object.entries(results).map(([name, data]) => [name, data.length]),
    )

    logger.warn('writing to analytics json', { countPerScraper })
    await writeToAnalytics('count')(countPerScraper)
  } catch (error) {
    logger.error('error scraping (main loop)', { error })
  }
}
