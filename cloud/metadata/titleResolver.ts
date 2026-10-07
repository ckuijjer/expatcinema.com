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
  /\+\s*q\s*&\s*a(?:\s+\w+)?/gi, // "+ Q&A Regisseur"
  /\bq\s*&\s*a\b/gi,
  /\bintroduction\b/gi,
  /\bwith\s+introduction\b/gi,
  /\benglish\s+subtitles?\b/gi,
  /\bengels\s+ondertiteld\b/gi,
  /\ben\s+subs?\b/gi,
  /\beng\.?\s+subs?\b/gi,
  /\bincl\.?\s+introduction\b/gi,
  /\bpart\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|i|ii|iii|iv|v|vi|vii|viii|ix|x|\d+)(?:\s*&\s*part\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|i|ii|iii|iv|v|vi|vii|viii|ix|x|\d+))?\b/gi,
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

  let previous = ''
  while (cleaned !== previous) {
    previous = cleaned
    const shouldStripDoubleBillSuffix =
      /\bpart\b/i.test(cleaned) && /\s*&\s*/.test(cleaned)

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

    if (shouldStripDoubleBillSuffix) {
      cleaned = cleaned.replace(/\s*&\s*[^&]+$/i, ' ')
    }
    cleaned = cleanupWhitespace(cleaned)
  }

  return cleaned
}

// "Het Offer (the Sacrifice)": the part in brackets is often the title in
// another language. A year, or a marker such as "(Eng Subs)", is not.
export const getBracketTitleVariants = (title: string) => {
  const match = /^(.*?)\s*\(([^()]{4,60})\)\s*$/.exec(title.trim())
  if (!match) {
    return []
  }

  const [, outside, inside] = match
  if (/^\d{4}$/.test(inside.trim()) || matchesNoisePattern(inside)) {
    return []
  }

  return Array.from(
    new Set(
      [outside, inside, inside.split(/,\s*/)[0]]
        .map((variant) => variant.trim())
        .filter((variant) => variant.length >= 3),
    ),
  )
}

// Only letters and digits, "&" as "and", without a leading article, so that
// "Goodbye, Lenin!" is the same as "Good Bye, Lenin!" and "Brief History of
// Love" the same as "A Brief History of Love"
export const compactTitle = (title: string) =>
  normalizeMovieTitleForLookup(title)
    .replace(/&/g, ' and ')
    .replace(/^(?:the|a|an|de|het|een|le|la|les|el|los|las|der|die|das)\s+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')

export const getTitleSearchVariants = (title: string) => {
  const stripped = stripTitleNoise(title)
  const normalizedRaw = normalizeMovieTitleForLookup(title)
  const normalizedStripped = normalizeMovieTitleForLookup(stripped)

  return Array.from(
    new Set(
      [
        title.trim(),
        stripped,
        normalizedRaw,
        normalizedStripped,
        ...getBracketTitleVariants(title),
      ].filter((value) => value.length > 0),
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

export const getMetadataLookupKey = (title: string, year?: number) =>
  `${normalizeMovieTitleForLookup(title)}::${year ?? ''}`

export const slugifyMovieTitle = (title: string) =>
  normalizeMovieTitleForLookup(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const SORT_TITLE_ARTICLE_PATTERNS = [
  // English
  [/^(?:a|an|the)\s+/i],
  // Dutch
  [/^(?:de|het|een)\s+/i],
  // French
  [/^(?:le|la|les|un|une)\s+/i],
  [/^l['’]/i],
  // Spanish
  [/^(?:el|los)\s+/i],
  // German
  [/^(?:der|das)\s+/i],
] as const

export const getMovieSortTitle = (title: string) => {
  const trimmedTitle = title.trim()

  for (const [pattern] of SORT_TITLE_ARTICLE_PATTERNS) {
    const match = trimmedTitle.match(pattern)
    if (match) {
      return trimmedTitle.slice(match[0].length).trimStart()
    }
  }

  return trimmedTitle
}

type ScoreCandidateInput = {
  title?: string
  originalTitle?: string
  releaseDate?: string
  alternativeTitles?: string[]
}

export type ScoredCandidate<T> = {
  candidate: T
  confidence: number
  // the release year is within a year of a year hint
  yearAgrees?: boolean
}

const getYearHints = (rawTitle: string, yearHints: number[]) =>
  Array.from(
    new Set(
      [...yearHints, extractYearHint(rawTitle)].filter(
        (value): value is number => typeof value === 'number',
      ),
    ),
  )

const getReleaseYear = (candidate: ScoreCandidateInput) =>
  candidate.releaseDate ? Number(candidate.releaseDate.slice(0, 4)) : undefined

const YEAR_TOLERANCE = 1

export const candidateYearAgrees = (
  rawTitle: string,
  candidate: ScoreCandidateInput,
  yearHints: number[] = [],
) => {
  const releaseYear = getReleaseYear(candidate)

  return (
    releaseYear !== undefined &&
    getYearHints(rawTitle, yearHints).some(
      (yearHint) => Math.abs(yearHint - releaseYear) <= YEAR_TOLERANCE,
    )
  )
}

const getYearScore = (releaseYear: number | undefined, yearHints: number[]) => {
  if (!releaseYear || yearHints.length === 0) {
    return 0.5
  }

  return Math.max(
    ...yearHints.map((yearHint) =>
      Math.max(0, 1 - Math.min(Math.abs(yearHint - releaseYear), 3) / 3),
    ),
  )
}

// The title is one part of a title with a subtitle: "Zur Lage" for "Zur Lage:
// Österreich in sechs Kapiteln"
const COLON_PART_SCORE = 0.95

export const scoreCandidateWithYearHints = (
  rawTitle: string,
  candidate: ScoreCandidateInput,
  yearHints: number[] = [],
) => {
  const normalizedRaw = normalizeMovieTitleForLookup(rawTitle)
  const normalizedStripped = normalizeMovieTitleForLookup(
    stripTitleNoise(rawTitle),
  )
  const titleVariants = [
    normalizedRaw,
    normalizedStripped,
    ...getBracketTitleVariants(rawTitle).map(normalizeMovieTitleForLookup),
  ]
  const uniqueYearHints = getYearHints(rawTitle, yearHints)

  const candidateTitles = [
    candidate.title,
    candidate.originalTitle,
    ...(candidate.alternativeTitles ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeMovieTitleForLookup)

  let bestTitleScore = candidateTitles.reduce((best, value) => {
    return Math.max(
      best,
      ...titleVariants.map((variant) => similarity(variant, value)),
    )
  }, 0)

  // These two take a title for the same film, so they need the year to agree.
  // Without a year "Brief History of Love" would match any film of that name.
  if (candidateYearAgrees(rawTitle, candidate, yearHints)) {
    const compactVariants = new Set(
      titleVariants.map(compactTitle).filter((value) => value.length >= 3),
    )

    if (
      candidateTitles.some((value) => compactVariants.has(compactTitle(value)))
    ) {
      bestTitleScore = Math.max(bestTitleScore, 1)
    } else if (
      candidateTitles.some(
        (value) =>
          value.includes(':') &&
          value
            .split(/:\s*/)
            .some((part) => compactVariants.has(compactTitle(part))),
      )
    ) {
      bestTitleScore = Math.max(bestTitleScore, COLON_PART_SCORE)
    }
  }

  const yearScore = getYearScore(getReleaseYear(candidate), uniqueYearHints)

  return bestTitleScore * 0.85 + yearScore * 0.15
}

export const scoreCandidate = (
  rawTitle: string,
  candidate: ScoreCandidateInput,
  yearHintOverride?: number,
) => {
  return scoreCandidateWithYearHints(
    rawTitle,
    candidate,
    yearHintOverride !== undefined ? [yearHintOverride] : [],
  )
}

// Of the candidates that score about the same, one whose release year agrees
// with the year of the screening wins over one that has no release date or a
// different one ("Los Silencios" 2019 over a film of that name without a date).
// Between those that agree, or when none does, the most popular one wins.
export const selectCandidateWithPopularityTieBreak = <
  T extends { popularity?: number },
>(
  candidates: Array<ScoredCandidate<T>>,
) => {
  const byConfidence = [...candidates].sort(
    (left, right) => right.confidence - left.confidence,
  )
  const bestConfidence = byConfidence[0]?.confidence

  if (bestConfidence === undefined) {
    return undefined
  }

  const confidenceBand = byConfidence.filter(
    (candidate) => bestConfidence - candidate.confidence < 0.05,
  )
  const yearConfirmed = confidenceBand.filter(
    (candidate) => candidate.yearAgrees,
  )
  const contenders = yearConfirmed.length > 0 ? yearConfirmed : confidenceBand
  const byPopularity = [...contenders].sort(
    (left, right) =>
      (right.candidate.popularity ?? -1) - (left.candidate.popularity ?? -1),
  )

  const winner = byPopularity[0] ?? byConfidence[0]
  const topPopularity = byPopularity[0]?.candidate.popularity ?? -1
  const secondPopularity = byPopularity[1]?.candidate.popularity ?? -1

  return {
    winner,
    // the winner was picked from several candidates (by year or popularity)
    hasPopularityTieBreak:
      contenders.length < confidenceBand.length ||
      (confidenceBand.length > 1 && topPopularity > secondPopularity),
  }
}
