// Counting visits and what people do on the site with GoatCounter
// (https://www.goatcounter.com): no cookies, nothing personal. Everything here
// does nothing while the code is empty or GoatCounter hasn't loaded, so it is
// safe in development, in tests and before the account exists.

import { GOATCOUNTER_CODE } from './goatcounterCode'

type Goatcounter = {
  count: (vars: {
    path: string
    event?: boolean
    title?: string
    referrer?: string
  }) => void
}

const getGoatcounter = (): Goatcounter | undefined => {
  if (!GOATCOUNTER_CODE || typeof window === 'undefined') return undefined
  const goatcounter = (window as { goatcounter?: Goatcounter }).goatcounter
  return typeof goatcounter?.count === 'function' ? goatcounter : undefined
}

// `from` is the page the visitor came from within the site. The app opens pages
// without loading them, so the browser's referrer is still the one the visit
// began with (Google, say) and GoatCounter wouldn't see the move from the home
// page to a film. Without `from` the script uses the browser's referrer.
export const countPageView = (path: string, from?: string) => {
  const origin =
    typeof window === 'undefined' ? undefined : window.location?.origin

  getGoatcounter()?.count({
    path,
    ...(from && origin && { referrer: `${origin}${from}` }),
  })
}

export const countEvent = (path: string) => {
  getGoatcounter()?.count({ path, event: true })
}

// A click on the link of a screening, which opens it on the website of the cinema
// with the film too, when it is matched: outbound/<cinema>/<film>
export const countOutbound = (cinemaSlug: string, movieSlug?: string) => {
  countEvent(
    movieSlug
      ? `outbound/${cinemaSlug}/${movieSlug}`
      : `outbound/${cinemaSlug}`,
  )
}

const MIN_TERM_LENGTH = 3
const MAX_TERM_LENGTH = 50

// What of a search is counted: lowercased, on one line, cut off at 50
// characters, and nothing that looks like an email address or a phone or other
// long number, in case someone typed that in the search box.
export const normaliseSearchTerm = (search: string): string | null => {
  const term = search
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TERM_LENGTH)
    .trim()

  if (term.length < MIN_TERM_LENGTH) return null
  if (term.includes('@')) return null
  if (/(?:\d[\s().+-]*){7,}/.test(term)) return null

  return term
}

// Long enough to get past the pauses while typing: with a second, the
// prefixes of one search (fat, fath, father) were counted as searches of their own
const SEARCH_DELAY = 3000

// A tag of an event or note that was clicked, so the search that follows is
// counted as coming from the tag and not from typing
let tagTerm: string | null = null
export const markSearchFromTag = (label: string) => {
  tagTerm = normaliseSearchTerm(label)
}

export const createSearchCounter = (
  count: (path: string) => void,
  delay = SEARCH_DELAY,
) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let last: string | undefined
  let pending: (() => void) | undefined

  const cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    pending = undefined
  }

  // Counts the search that is waiting, without waiting any longer
  const flush = () => {
    const run = pending
    cancel()
    run?.()
  }

  // Counts a search once it has been left alone for a few seconds, and only
  // when it is something else than the search counted before
  const search = (value: string, found: boolean) => {
    cancel()

    const term = normaliseSearchTerm(value)
    if (!term) return

    pending = () => {
      const fromTag = term === tagTerm
      const kind = fromTag ? 'search-tag' : found ? 'search' : 'search-none'
      const key = `${kind}/${term}`
      if (fromTag) tagTerm = null
      if (key === last) return
      last = key
      count(key)
    }
    timer = setTimeout(flush, delay)
  }

  return { search, cancel, flush }
}

const searchCounter = createSearchCounter(countEvent)

// `found` is whether the search left any screening
export const countSearch = searchCounter.search

// A search that is still waiting when the visitor leaves is counted then,
// not lost
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') searchCounter.flush()
  })
}
