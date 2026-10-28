import { Screening } from '../types'
import amstelveen from './amstelveen'
import bioscopenleiden from './bioscopenleiden'
import castellum from './castellum'
import chasse from './chasse'
import cinecenter from './cinecenter'
import cinecitta from './cinecitta'
import cinemadevlugt from './cinemadevlugt'
import cinemathepulse from './cinemathepulse'
import cinerama from './cinerama'
import concordia from './concordia'
import debalie from './debalie'
import desien from './desien'
import dewittdordrecht from './dewittdordrecht'
import defilmhallen from './defilmhallen'
import deuitkijk from './deuitkijk'
import dokhuis from './dokhuis'
import eyefilm from './eyefilm'
import fchyena from './fchyena'
import filmhuisbussum from './filmhuisbussum'
import filmhuiscavia from './filmhuiscavia'
import filmhuisbreda from './filmhuisbreda'
import filmhuisdenhaag from './filmhuisdenhaag'
import filmhuisdespiegel from './filmhuisdespiegel'
import filmtheaterhilversum from './filmtheaterhilversum'
import filmhuislumen from './filmhuislumen'
import filmkoepel from './filmkoepel'
import florafilmtheater from './florafilmtheater'
import focusarnhem from './focusarnhem'
import forumgroningen from './forumgroningen'
import hartlooper from './hartlooper'
import heerenstraattheater from './heerenstraattheater'
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
import rialtovu from './rialtovu'
import schuur from './schuur'
import sliekerfilm from './sliekerfilm'
import slachtstraat from './slachtstraat'
import springhaver from './springhaver'
import studiok from './studiok'
import themovies from './themovies'
import ventilator from './ventilator'
import worm from './worm'

export type Scraper = () => Promise<Screening[]>

export const SCRAPERS: Record<string, Scraper> = {
  amstelveen,
  bioscopenleiden,
  castellum,
  chasse,
  cinecenter,
  cinecitta,
  cinemadevlugt,
  cinemathepulse,
  cinerama,
  concordia,
  debalie,
  desien,
  dewittdordrecht,
  defilmhallen,
  deuitkijk,
  dokhuis,
  eyefilm,
  fchyena,
  filmhuisbussum,
  filmhuiscavia,
  filmhuisbreda,
  filmhuisdenhaag,
  filmhuisdespiegel,
  filmtheaterhilversum,
  filmhuislumen,
  filmkoepel,
  florafilmtheater, // uses puppeteer
  focusarnhem, // uses puppeteer
  forumgroningen,
  hartlooper,
  heerenstraattheater,
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
  rialtovu,
  schuur, // uses puppeteer
  sliekerfilm,
  slachtstraat,
  springhaver,
  studiok,
  themovies,
  ventilator,
  worm,
}

// The scrapers to run: SCRAPERS=a,b limits it, for running a few locally
export const getEnabledScrapers = () => {
  if (process.env.SCRAPERS) {
    const names = process.env.SCRAPERS.split(',')

    return Object.fromEntries(
      Object.entries(SCRAPERS).filter(([name]) => names.includes(name)),
    )
  }

  return SCRAPERS
}
