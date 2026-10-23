import { Metadata } from './types'

// The lookups to retry with the years that other screenings of the same title
// matched. That is a lookup that did not match, and a lookup without a year
// that matched only because the most popular of equally good candidates was
// taken: with Lumière and Concordia saying "Leviathan" is from 2014, Forum's
// "Leviathan" without a year is not the more popular 1989 film.
export const needsSiblingYearRetry = (
  metadata: Pick<Metadata, 'year' | 'match'>,
) =>
  metadata.match.status !== 'matched' ||
  (metadata.year === undefined && metadata.match.popularityTieBreak === true)
