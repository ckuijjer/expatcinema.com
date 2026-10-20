// Compares how the screenings are matched to TMDB with and without the
// director the cinemas give, to see what the director changes:
//
//   node --env-file=.env.local --import tsx evaluateDirectorMatching.ts raw.json report.json
//
// raw.json is a list of screenings with a director, e.g. the results of all
// scrapers (see runScraper.ts) put together. It asks TMDB for every title, twice.
import { readFile, writeFile } from 'node:fs/promises'

import { resolveMetadata } from './metadata/resolveMetadata'
import { getMetadataLookupKey } from './metadata/titleResolver'
import { Metadata } from './metadata/types'
import { Screening } from './types'

const [rawPath, reportPath = 'director-matching-report.json'] =
  process.argv.slice(2)

if (!rawPath) {
  console.error('Usage: evaluateDirectorMatching.ts raw.json [report.json]')
  process.exit(1)
}

const screenings: Screening[] = JSON.parse(await readFile(rawPath, 'utf8'))

const summarize = (metadata: Metadata) => ({
  status: metadata.match.status,
  method: metadata.match.method,
  movieId: metadata.movieId,
  title: metadata.tmdb?.title,
  releaseDate: metadata.tmdb?.releaseDate,
  directors: metadata.tmdb?.directors,
  confidence: metadata.match.confidence,
  directorMatch: metadata.match.directorMatch,
  candidates: metadata.match.candidates,
})

const toMap = (metadata: Metadata[]) =>
  new Map(
    metadata.map((entry) => [
      getMetadataLookupKey(entry.query, entry.year),
      entry,
    ]),
  )

const timed = async (useDirectors: boolean) => {
  const start = Date.now()
  const { metadata } = await resolveMetadata(screenings, { useDirectors })
  console.error(
    `${useDirectors ? 'with' : 'without'} directors: ${Math.round((Date.now() - start) / 1000)}s`,
  )
  return toMap(metadata)
}

const before = await timed(false)
const after = await timed(true)

const cinemaDirectors = new Map<string, string[]>()
const cinemas = new Map<string, Set<string>>()
for (const { title, year, director, cinema } of screenings) {
  const key = getMetadataLookupKey(title, year)
  cinemaDirectors.set(
    key,
    Array.from(
      new Set([...(cinemaDirectors.get(key) ?? []), director ?? '']),
    ).filter(Boolean),
  )
  cinemas.set(key, (cinemas.get(key) ?? new Set()).add(cinema))
}

const isMatched = (metadata?: Metadata) =>
  metadata?.match.status === 'matched' || metadata?.match.status === 'manual'

const rows = Array.from(before.keys()).map((key) => {
  const b = before.get(key)!
  const a = after.get(key)!
  const titles = (a.query ?? b.query) as string

  const category =
    !isMatched(b) && isMatched(a)
      ? 'newly matched'
      : isMatched(b) && !isMatched(a)
        ? 'no longer matched'
        : isMatched(b) && isMatched(a) && b.movieId !== a.movieId
          ? 'other film'
          : isMatched(b) && isMatched(a)
            ? 'same film'
            : b.match.status !== a.match.status
              ? 'status changed'
              : 'still not matched'

  return {
    key,
    query: titles,
    year: b.year,
    cinemas: Array.from(cinemas.get(key) ?? []),
    cinemaDirectors: cinemaDirectors.get(key) ?? [],
    category,
    before: summarize(b),
    after: summarize(a),
  }
})

const count = (predicate: (row: (typeof rows)[number]) => boolean) =>
  rows.filter(predicate).length

const summary = {
  lookups: rows.length,
  withDirector: count((row) => row.cinemaDirectors.length > 0),
  byCategory: Object.fromEntries(
    Array.from(new Set(rows.map((row) => row.category))).map((category) => [
      category,
      count((row) => row.category === category),
    ]),
  ),
  beforeByStatus: Object.fromEntries(
    ['matched', 'manual', 'ambiguous', 'unmatched'].map((status) => [
      status,
      count((row) => row.before.status === status),
    ]),
  ),
  afterByStatus: Object.fromEntries(
    ['matched', 'manual', 'ambiguous', 'unmatched'].map((status) => [
      status,
      count((row) => row.after.status === status),
    ]),
  ),
  // of the films that are matched with a director: does the director of the
  // film agree
  afterMatchedByDirectorMatch: Object.fromEntries(
    ['agree', 'disagree', 'unknown', 'none'].map((value) => [
      value,
      count(
        (row) =>
          row.after.status === 'matched' &&
          (row.after.directorMatch ?? 'none') === value,
      ),
    ]),
  ),
  newlyMatchedByMethod: Object.fromEntries(
    [
      'tmdb-search',
      'director',
      'director-year',
      'shared-label',
      'title-part',
    ].map((method) => [
      method,
      count(
        (row) =>
          row.category === 'newly matched' && row.after.method === method,
      ),
    ]),
  ),
}

await writeFile(reportPath, JSON.stringify({ summary, rows }, null, 2))
console.log(JSON.stringify(summary, null, 2))
process.exit(0)
