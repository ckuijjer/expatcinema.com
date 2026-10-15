// A site can answer 502/503/504 now and then, also to the home IP of the relay
// (Filmtheater Hilversum does that for a fifth of its film pages in a run, and
// the same pages are fine a bit later), and 429 when it has had enough requests.
// Those are tried again after a pause that grows each time, with some jitter so
// that the requests that failed together do not come back together
const RETRY_STATUSES = new Set([429, 502, 503, 504])
const RETRY_DELAYS_MS = [1_000, 3_000, 6_000]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withJitter = (ms: number) => Math.round(ms * (0.5 + Math.random()))

export const retryOnServerError = async <T extends { statusCode: number }>(
  attempt: () => Promise<T>,
  delays: number[] = RETRY_DELAYS_MS,
): Promise<T> => {
  for (const delay of delays) {
    const result = await attempt()

    if (!RETRY_STATUSES.has(result.statusCode)) return result

    await sleep(withJitter(delay))
  }

  // the last try: whatever comes back is the answer
  return attempt()
}
