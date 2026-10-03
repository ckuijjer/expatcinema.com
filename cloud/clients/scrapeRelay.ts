import got from 'got'

// Some cinema sites block requests from AWS, where the scrapers Lambda runs
// (Cloudflare for Filmhuis Breda and Heerenstraattheater, Kinepolis' firewall
// for Cinerama) but accept a home IP. Those pages are fetched through a small
// relay on the maintainer's home server ("teatree"), which is reached through
// a public URL (behind Pangolin) and a token. The token is sent twice: as HTTP
// basic auth, which Pangolin checks at the edge, and in X-Relay-Token, which
// the relay checks itself (so it doesn't matter whether Pangolin forwards the
// Authorization header). The relay only fetches an allowlist of hosts; keep
// RELAYED_HOSTS and the relay's ALLOWED_HOSTS
// (~/docker/scrape-relay/docker-compose.yml on teatree) in sync.
//
// Without SCRAPE_RELAY_URL and SCRAPE_RELAY_TOKEN (local runs, or before the
// secrets are set) nothing is relayed and requests go out directly, as before.
export const RELAYED_HOSTS = new Set([
  'www.filmhuisbreda.nl',
  'www.heerenstraattheater.nl',
  'kinepolisweb-programmation.kinepolis.com',
  'www.chasse.nl',
])

// Username of the HTTP basic auth that Pangolin checks; the password is the token
const RELAY_USER = 'scrape-relay'

const relayConfig = () => {
  const url = process.env.SCRAPE_RELAY_URL
  const token = process.env.SCRAPE_RELAY_TOKEN
  return url && token ? { url: url.replace(/\/+$/, ''), token } : undefined
}

export const shouldRelay = (url: string) => {
  if (!relayConfig()) return false

  try {
    return RELAYED_HOSTS.has(new URL(url).hostname.toLowerCase())
  } catch {
    return false
  }
}

type RelayResponse = {
  status: number // the upstream status, not the relay's
  url: string // final url, after redirects
  body: string
}

export const relayGet = async (
  url: string,
  headers: Record<string, string> = {},
) => {
  const config = relayConfig()
  if (!config) throw new Error('scrape relay is not configured')

  // A relay problem (wrong token, host not allowed, relay down) surfaces as a
  // thrown HTTPError/RequestError, so it shows up in the scraper's own error
  // handling and in Slack, instead of looking like an empty programme.
  const response = await got
    .post(`${config.url}/fetch`, {
      headers: {
        authorization: `Basic ${Buffer.from(`${RELAY_USER}:${config.token}`).toString('base64')}`,
        'x-relay-token': config.token,
      },
      json: { url, headers },
      timeout: { request: 60_000 },
      retry: { limit: 2, methods: ['POST'] },
    })
    .json<RelayResponse>()

  return {
    statusCode: response.status,
    url: response.url,
    body: response.body,
  }
}

export const relayJson = async <T>(
  url: string,
  headers: Record<string, string> = {},
): Promise<T> => {
  const { statusCode, body } = await relayGet(url, headers)

  if (statusCode >= 400) {
    throw new Error(`Non-ok response retrieving ${url}: ${statusCode}`)
  }

  return JSON.parse(body) as T
}
