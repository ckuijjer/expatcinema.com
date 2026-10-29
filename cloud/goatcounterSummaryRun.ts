// Prints the GoatCounter summary of the last 7 days, see goatcounterSummary.ts:
//
//   pnpm goatcounter:summary
import { type Hit, summarise } from './goatcounterSummary'

const SITE = 'https://expatcinema.goatcounter.com'

const get = async (path: string, token: string): Promise<any> => {
  const response = await fetch(`${SITE}/api/v0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  // the API allows 4 requests per second
  await new Promise((resolve) => setTimeout(resolve, 300))
  return response.json()
}

const run = async () => {
  const token = process.env.GOATCOUNTER_API_TOKEN
  if (!token) throw new Error('GOATCOUNTER_API_TOKEN is not set')

  // 7 whole days ending at the start of the current hour
  const end = new Date()
  end.setUTCMinutes(0, 0, 0)
  const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000)
  const range = `start=${start.toISOString()}&end=${end.toISOString()}`

  const totals = await get(`/stats/total?${range}`, token)

  const hits: Hit[] = []
  const seen: number[] = []
  for (;;) {
    const exclude = seen.length ? `&exclude_paths=${seen.join(',')}` : ''
    const page = await get(`/stats/hits?${range}&limit=100${exclude}`, token)
    for (const hit of page.hits) {
      hits.push({ path: hit.path, count: hit.count, event: hit.event })
      seen.push(hit.path_id)
    }
    if (!page.more || page.hits.length === 0) break
  }

  console.log(summarise(hits, totals.total))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
