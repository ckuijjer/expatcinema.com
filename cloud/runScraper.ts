// Runs a single scraper from the command line and prints its screenings as JSON:
//
//   pnpm scraper scrapers/kinorotterdam.ts
//
// Scrapers export their scrape function as the default export and have no
// side effects on import, so they can be imported in tests as well.
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const file = process.argv[2]

if (!file) {
  console.error('Usage: runScraper.ts scrapers/<name>.ts')
  process.exit(1)
}

try {
  const { default: scraper } = await import(pathToFileURL(resolve(file)).href)

  if (typeof scraper !== 'function') {
    throw new Error(`${file} has no default export that is a function`)
  }

  console.log(JSON.stringify(await scraper(), null, 2))

  // Exit explicitly: a scraper that launched Chromium would otherwise keep the
  // process alive. Puppeteer kills the browser it launched on exit.
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
