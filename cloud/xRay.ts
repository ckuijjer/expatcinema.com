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

// A cookie jar that is just enough for a site that sets a cookie on a redirect
// and wants it back, such as the CDN gate of natlab.nl: / -> /csq/ (sets a
// token) -> /, which loops forever without the cookie. Cookies are kept per
// host; path, expiry and the other attributes are ignored.
export const createCookieJar = () => {
  const cookies = new Map<string, Map<string, string>>()

  return {
    setCookie: async (rawCookie: string, url: string) => {
      const [pair] = rawCookie.split(';')
      const separator = pair.indexOf('=')
      if (separator <= 0) return

      const host = new URL(url).hostname
      const hostCookies = cookies.get(host) ?? new Map<string, string>()
      hostCookies.set(
        pair.slice(0, separator).trim(),
        pair.slice(separator + 1).trim(),
      )
      cookies.set(host, hostCookies)
    },
    getCookieString: async (url: string) =>
      [...(cookies.get(new URL(url).hostname) ?? [])]
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
  }
}

const createGotDriver =
  (logger?: Logger, cookieJar?: ReturnType<typeof createCookieJar>): Driver =>
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
      // Without a timeout got waits for a stalled connection forever, and
      // honours any Retry-After on a 503 or 429, however long
      timeout: { request: 30_000 },
      retry: { limit: 2, maxRetryAfter: 10_000 },
      hooks: {
        afterResponse: [logNonOkResponseHook(logger)],
        beforeError: [logErrorHook(logger)],
      },
      throwHttpErrors: false,
      cookieJar,
    })
      .then((response) => callback(null, response.body as never))
      .catch((err) => callback(err, null as never))
  }

type CreateXrayOptions = Partial<Xray.Options> & {
  logger?: Logger
  // Send the cookies a site sets back to it, for the requests of this xray
  cookies?: boolean
}

export const createXray = ({
  logger,
  filters,
  cookies = false,
}: CreateXrayOptions = {}) =>
  Xray({
    filters: {
      trim,
      normalizeWhitespace,
      ...filters,
    },
  })
    .concurrency(10)
    .throttle(10, 300)
    .driver(createGotDriver(logger, cookies ? createCookieJar() : undefined))
