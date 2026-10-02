import { readdirSync } from 'node:fs'

// Importing a scraper must not run it (or anything else with side effects), so
// all of them can be imported in tests, and run with `pnpm scraper`
const scraperFiles = readdirSync('scrapers')
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
  .map((file) => file.replace(/\.ts$/, ''))

describe('scrapers', () => {
  test.each(scraperFiles)('%s exports its scrape function', async (name) => {
    const { default: scraper } = await import(`../scrapers/${name}`)

    expect(typeof scraper).toBe('function')
  })
})
