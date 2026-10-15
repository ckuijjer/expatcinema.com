import got from 'got'
import Xray from 'x-ray'
import { type Driver } from 'x-ray-crawler'
import { Logger } from '@aws-lambda-powertools/logger'

import { logErrorHook } from './clients/gotHooks'
import { retryOnServerError } from './clients/retryOnServerError'
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
    const url = String(context.url)
    const log = logger ?? defaultLogger

    // Hosts that block AWS are fetched through the relay on the home server
    const relayed = shouldRelay(url)
    const attempt = relayed
      ? () => relayGet(url, { 'user-agent': USER_AGENT })
      : () =>
          got(url, {
            headers: { 'user-agent': USER_AGENT },
            // Without a timeout got waits for a stalled connection forever
            timeout: { request: 30_000 },
            // A connection that fails is tried again by got, an answer with a
            // 5xx or 429 by retryOnServerError, for both the relay and got
            retry: { limit: 2, statusCodes: [] },
            hooks: { beforeError: [logErrorHook(logger)] },
            throwHttpErrors: false,
            cookieJar,
          }).then((response) => ({
            statusCode: response.statusCode,
            body: response.body,
          }))

    retryOnServerError(attempt)
      .then((response) => {
        if (response.statusCode >= 400) {
          log.warn(`Non-ok response retrieving ${url}: ${response.statusCode}`)
        }
        callback(null, response.body as never)
      })
      .catch((err) => {
        log.error(
          `Error retrieving ${url}${relayed ? ' via relay' : ''}: ${err.message}`,
        )
        callback(err, null as never)
      })
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
