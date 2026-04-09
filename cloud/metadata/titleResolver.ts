import leven from 'leven'

import { removeDiacritics } from '../scrapers/utils/removeDiacritics'

const NOISE_PATTERNS = [
  /\b4k\b/gi,
  /\brestoration\b/gi,
  /\b\d{1,3}(st|nd|rd|th)\s+anniversary\b/gi,
  /\banniversary\b/gi,
  /\bdirector'?s?\s+cut\b/gi,
  /\bextended\s+cut\b/gi,
  /\bfinal\s+cut\b/gi,
  /\buncut\b/gi,
  /\bpreview\b/gi,
  /\bavant[-\s]?premiere\b/gi,
  /\bsneak\s+preview\b/gi,
  /\bq\s*&\s*a\b/gi,
  /\bintroduction\b/gi,
  /\bwith\s+introduction\b/gi,
  /\benglish\s+subtitles?\b/gi,
  /\bengels\s+ondertiteld\b/gi,
  /\ben\s+subs?\b/gi,
]

const cleanupWhitespace = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\s([:)\]])/g, '$1')
    .trim()

const matchesNoisePattern = (value: string) =>
  NOISE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(value)
  })

export const normalizeMovieTitleForLookup = (title: string) =>
  cleanupWhitespace(removeDiacritics(title).replace(/[’`]/g, "'").toLowerCase())

export const extractYearHint = (title: string): number | undefined => {
  const match = title.match(/\b(18|19|20)\d{2}\b/)
  return match ? Number(match[0]) : undefined
}

export const stripTitleNoise = (title: string) => {
  let cleaned = title.replace(/[’`]/g, "'")

  cleaned = cleaned.replace(/\[(.*?)\]/g, ' ')
  cleaned = cleaned.replace(/\((.*?)\)/g, (fullMatch, inner) => {
    return matchesNoisePattern(inner) || /^\d{4}$/.test(inner.trim())
      ? ' '
      : fullMatch
  })

  cleaned = cleaned.replace(/\s[-–,:]\s/g, ' ')
  NOISE_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0
    cleaned = cleaned.replace(pattern, ' ')
  })

  cleaned = cleaned.replace(/\b(18|19|20)\d{2}\b/g, ' ')
  return cleanupWhitespace(cleaned)
}

export const getTitleSearchVariants = (title: string) => {
  const stripped = stripTitleNoise(title)
  const normalizedRaw = normalizeMovieTitleForLookup(title)
  const normalizedStripped = normalizeMovieTitleForLookup(stripped)

  return Array.from(
    new Set(
      [title.trim(), stripped, normalizedRaw, normalizedStripped].filter(
        (value) => value.length > 0,
      ),
    ),
  )
}

const similarity = (left: string, right: string) => {
  if (!left || !right) {
    return 0
  }

  if (left === right) {
    return 1
  }

  const distance = leven(left, right)
  return Math.max(0, 1 - distance / Math.max(left.length, right.length))
}

export const getMovieId = (tmdbId: number) => `tmdb:${tmdbId}`

type ScoreCandidateInput = {
  title?: string
  originalTitle?: string
  releaseDate?: string
  alternativeTitles?: string[]
}

export const scoreCandidate = (
  rawTitle: string,
  candidate: ScoreCandidateInput,
) => {
  const normalizedRaw = normalizeMovieTitleForLookup(rawTitle)
  const normalizedStripped = normalizeMovieTitleForLookup(
    stripTitleNoise(rawTitle),
  )
  const yearHint = extractYearHint(rawTitle)

  const candidateTitles = [
    candidate.title,
    candidate.originalTitle,
    ...(candidate.alternativeTitles ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeMovieTitleForLookup)

  const bestTitleScore = candidateTitles.reduce((best, value) => {
    return Math.max(
      best,
      similarity(normalizedRaw, value),
      similarity(normalizedStripped, value),
    )
  }, 0)

  const releaseYear = candidate.releaseDate
    ? Number(candidate.releaseDate.slice(0, 4))
    : undefined
  const yearScore =
    yearHint && releaseYear
      ? Math.max(0, 1 - Math.min(Math.abs(yearHint - releaseYear), 3) / 3)
      : 0.5

  return bestTitleScore * 0.85 + yearScore * 0.15
}
