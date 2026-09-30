import got from 'got'
import Xray from 'x-ray'
import { type Driver } from 'x-ray-crawler'
import { Logger } from '@aws-lambda-powertools/logger'

import { logErrorHook, logNonOkResponseHook } from './clients/gotHooks'
import { relayGet, shouldRelay } from './clients/scrapeRelay'
import { logger as defaultLogger } from './powertools'
import { normalizeWhitespace, trim } from './scrapers/utils/xrayFilters'

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const createGotDriver =
  (logger?: Logger): Driver =>
  (context, callback) => {
    const { url } = context

    // Hosts that block AWS are fetched through the relay on the home server
    if (shouldRelay(String(url))) {
      const log = logger ?? defaultLogger

      relayGet(String(url), { 'user-agent': USER_AGENT })
        .then((response) => {
          if (response.statusCode >= 400) {
            log.warn(
              `Non-ok response retrieving ${url}: ${response.statusCode}`,
            )
          }
          callback(null, response.body as never)
        })
        .catch((err) => {
          log.error(`Error retrieving ${url} via relay: ${err.message}`)
          callback(err, null as never)
        })
      return
    }

    got(String(url), {
      headers: { 'user-agent': USER_AGENT },
      hooks: {
        afterResponse: [logNonOkResponseHook(logger)],
        beforeError: [logErrorHook(logger)],
      },
      throwHttpErrors: false,
    })
      .then((response) => callback(null, response.body as never))
      .catch((err) => callback(err, null as never))
  }

type CreateXrayOptions = Partial<Xray.Options> & { logger?: Logger }

export const createXray = ({ logger, filters }: CreateXrayOptions = {}) =>
  Xray({
    filters: {
      trim,
      normalizeWhitespace,
      ...filters,
    },
  })
    .concurrency(10)
    .throttle(10, 300)
    .driver(createGotDriver(logger))
