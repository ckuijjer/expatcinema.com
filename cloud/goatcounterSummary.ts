// Summarises the hits of the last 7 days of GoatCounter as markdown, the
// script that fetches them is goatcounterSummaryRun.ts:
//
//   pnpm goatcounter:summary
//
// Needs GOATCOUNTER_API_TOKEN, a token that can only read statistics
// (https://expatcinema.goatcounter.com/user/api). The events are counted by
// the website as `search/<term>`, `search-none/<term>`, `search-tag/<tag>` and
// `outbound/<cinema>[/<film>]` (web/utils/goatcounter.ts).
export type Hit = { path: string; count: number; event: boolean }

const top = (rows: Map<string, number>, n: number) =>
  [...rows.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)

const add = (rows: Map<string, number>, key: string, count: number) =>
  rows.set(key, (rows.get(key) ?? 0) + count)

const list = (rows: [string, number][]) =>
  rows.length
    ? rows.map(([name, count]) => `- ${name}: ${count}`).join('\n')
    : '- none'

export const summarise = (hits: Hit[], total?: number) => {
  const pages = new Map<string, number>()
  const searches = new Map<string, number>()
  const noResults = new Map<string, number>()
  const fromTag = new Map<string, number>()
  const cinemas = new Map<string, number>()
  const films = new Map<string, number>()

  for (const { path: rawPath, count, event } of hits) {
    const path = rawPath.replace(/^\//, '')
    if (!event) {
      add(pages, rawPath, count)
      continue
    }
    const [kind, ...rest] = path.split('/')
    const name = rest.join('/')
    if (kind === 'search') add(searches, name, count)
    else if (kind === 'search-none') add(noResults, name, count)
    else if (kind === 'search-tag') add(fromTag, name, count)
    else if (kind === 'outbound') {
      const [cinema, film] = rest
      add(cinemas, cinema, count)
      if (film) add(films, `${film} (${cinema})`, count)
    }
  }

  const sum = (rows: Map<string, number>) =>
    [...rows.values()].reduce((a, b) => a + b, 0)

  return [
    `## GoatCounter, last 7 days`,
    total === undefined ? '' : `Visitors: ${total}`,
    `Clicks out to a cinema: ${sum(cinemas)}, searches: ${sum(searches) + sum(noResults)} (${sum(noResults)} without a result)`,
    `### Top pages\n${list(top(pages, 10))}`,
    `### Searches\n${list(top(searches, 10))}`,
    `### Searches without a result (a missing film or cinema?)\n${list(top(noResults, 20))}`,
    `### Clicks on a tag\n${list(top(fromTag, 10))}`,
    `### Clicks out per cinema\n${list(top(cinemas, 20))}`,
    `### Clicks out per film\n${list(top(films, 10))}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
