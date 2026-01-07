/**
 * Scraper Registry
 *
 * Categorizes scrapers by type (HTTP vs Puppeteer) for the Step Functions workflow.
 * HTTP scrapers use got/fetch for simple API calls.
 * Puppeteer scrapers require headless Chrome for JavaScript-heavy sites.
 */

import { Screening } from '../types'

import bioscopenleiden from './bioscopenleiden'
import cinecenter from './cinecenter'
import cinecitta from './cinecitta'
import cinerama from './cinerama'
import concordia from './concordia'
import defilmhallen from './defilmhallen'
import deuitkijk from './deuitkijk'
import dokhuis from './dokhuis'
import eyefilm from './eyefilm'
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

export type ScraperFunction = () => Promise<Screening[]>

export type ScraperRegistry = {
  [key: string]: ScraperFunction
}

/**
 * HTTP-based scrapers that use got/fetch for simple API calls.
 * These scrapers are lightweight and can run with minimal memory (256MB).
 */
export const HTTP_SCRAPERS: ScraperRegistry = {
  bioscopenleiden,
  cinecenter,
  cinecitta,
  cinerama,
  concordia,
  defilmhallen,
  deuitkijk,
  dokhuis,
  eyefilm,
  filmhuisdenhaag,
  filmhuislumen,
  filmkoepel,
  forumgroningen,
  hartlooper,
  hetdocumentairepaviljoen,
  kinorotterdam,
  kriterion,
  lab1,
  lantarenvenster,
  lux,
  melkweg,
  natlab,
  rialto,
  slachtstraat,
  springhaver,
  studiok,
  themovies,
}

/**
 * Puppeteer-based scrapers that require headless Chrome.
 * These scrapers need more memory (4GB) due to Chrome overhead.
 */
export const PUPPETEER_SCRAPERS: ScraperRegistry = {
  florafilmtheater,
  focusarnhem,
  ketelhuis,
  lab111,
  lumiere,
  schuur,
}

/**
 * All scrapers combined (for backwards compatibility)
 */
export const ALL_SCRAPERS: ScraperRegistry = {
  ...HTTP_SCRAPERS,
  ...PUPPETEER_SCRAPERS,
}

/**
 * Get scraper names by type
 */
export const getHttpScraperNames = (): string[] => Object.keys(HTTP_SCRAPERS)
export const getPuppeteerScraperNames = (): string[] =>
  Object.keys(PUPPETEER_SCRAPERS)
export const getAllScraperNames = (): string[] => Object.keys(ALL_SCRAPERS)

/**
 * Get a scraper function by name
 */
export const getScraper = (name: string): ScraperFunction | undefined =>
  ALL_SCRAPERS[name]

/**
 * Check if a scraper is Puppeteer-based
 */
export const isPuppeteerScraper = (name: string): boolean =>
  name in PUPPETEER_SCRAPERS
