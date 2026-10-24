// Matches screenings that were scraped earlier to TMDB again, to see what a
// change in the matching does on the same screenings:
//
//   node --env-file=.env.local --import tsx rematch.ts out-dir screenings.json...
//   node --env-file=.env.local --import tsx rematch.ts --no-directors out-dir screenings.json...
//
// A screenings file is a list of screenings, e.g. the result of a scraper (see
// runScraper.ts) or the private bucket's <scraper>/<time>.json, which have the
// director. The public screenings.json has none, so the director isn't used.
// It asks TMDB for every title, and writes screenings.json, movies.json,
// title-matches.json and the review lists to out-dir
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { rematch } from './pipeline/rematch'
import { Screening } from './types'

const args = process.argv.slice(2)
const useDirectors = !args.includes('--no-directors')
const [outDir, ...files] = args.filter((arg) => !arg.startsWith('--'))

if (!outDir || files.length === 0) {
  console.error('Usage: rematch.ts [--no-directors] out-dir screenings.json...')
  process.exit(1)
}

const screenings: Screening[] = (
  await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(file, 'utf8'))),
  )
)
  .flat()
  // a screening with a date that isn't one is saved as null, and stays that way
  .map((screening) => ({
    ...screening,
    date: screening.date === null ? new Date(NaN) : new Date(screening.date),
  }))

const {
  screenings: resolved,
  movies,
  titleMatches,
  review,
} = await rematch(screenings, { useDirectors })

const outputs = {
  'screenings.json': resolved,
  'movies.json': movies,
  'title-matches.json': titleMatches,
  'review/ambiguous-movies.json': review.ambiguous,
  'review/unmatched-movies.json': review.unmatched,
  'review/director-disagreements.json': review.directorDisagreements,
  'review/detected-events.json': review.detectedEvents,
}

for (const [name, data] of Object.entries(outputs)) {
  await mkdir(join(outDir, name, '..'), { recursive: true })
  await writeFile(join(outDir, name), JSON.stringify(data, null, 2))
}

console.error(
  `${screenings.length} screenings, ${movies.length} movies, ${titleMatches.length} lookups, written to ${outDir}`,
)
process.exit(0)
