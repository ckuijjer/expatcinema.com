// Counting visits and what people do on the site with GoatCounter
// (https://www.goatcounter.com): no cookies, nothing personal. Everything here
// does nothing while the code is empty or GoatCounter hasn't loaded, so it is
// safe in development, in tests and before the account exists.

import { GOATCOUNTER_CODE } from './goatcounterCode'

type Goatcounter = {
  count: (vars: { path: string; event?: boolean; title?: string }) => void
}

const getGoatcounter = (): Goatcounter | undefined => {
  if (!GOATCOUNTER_CODE || typeof window === 'undefined') return undefined
  const goatcounter = (window as { goatcounter?: Goatcounter }).goatcounter
  return typeof goatcounter?.count === 'function' ? goatcounter : undefined
}

export const countPageView = (path: string) => {
  getGoatcounter()?.count({ path })
}

export const countEvent = (path: string) => {
  getGoatcounter()?.count({ path, event: true })
}

// A click on the link of a screening, which opens it on the website of the cinema
export const countOutbound = (cinemaSlug: string) => {
  countEvent(`outbound/${cinemaSlug}`)
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

const SEARCH_DELAY = 1000

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

  const cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  // Counts a search once it has been left alone for a second, and only when it
  // is something else than the search counted before
  const search = (value: string, found: boolean) => {
    cancel()

    const term = normaliseSearchTerm(value)
    if (!term) return

    timer = setTimeout(() => {
      timer = undefined
      const fromTag = term === tagTerm
      const kind = fromTag ? 'search-tag' : found ? 'search' : 'search-none'
      const key = `${kind}/${term}`
      if (fromTag) tagTerm = null
      if (key === last) return
      last = key
      count(key)
    }, delay)
  }

  return { search, cancel }
}

const searchCounter = createSearchCounter(countEvent)

// `found` is whether the search left any screening
export const countSearch = searchCounter.search
