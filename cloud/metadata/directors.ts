import leven from 'leven'

import { removeDiacritics } from '../scrapers/utils/removeDiacritics'
import { DirectorMatch } from './types'

// How alike two spellings of a name have to be to be the same name:
// "Andrej Zvjagintsev" and "Andrey Zvyagintsev", "Jûzô Itami" and "Juzo Itami"
const NAME_SIMILARITY = 0.8

// Letters that don't have a diacritic to remove
const LETTERS: Record<string, string> = {
  đ: 'd',
  ø: 'o',
  ł: 'l',
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
}

// A name has two or three words, a longer text isn't a name (a cinema that
// gives a description of the film as the director)
const MAX_NAME_WORDS = 5

const normalizeName = (name: string) =>
  removeDiacritics(name.toLowerCase().replace(/[đøłßæœ]/g, (c) => LETTERS[c]))
    .replace(/\([^)]*\)/g, ' ') // "(1, 3, 4)" after a name
    .replace(/['’`-]/g, '') // "Shin'ichiro", "Kore-eda"
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const similarity = (left: string, right: string) =>
  left === right
    ? 1
    : 1 - leven(left, right) / Math.max(left.length, right.length)

// What the cinemas write for the director of a film is free text: "A & B",
// "A, B", "A en B", "A (1, 3), B (2)". Gives the names in it.
export const parseDirectorNames = (directors: string[] = []) =>
  Array.from(
    new Set(
      directors
        .flatMap((director) =>
          director
            .replace(/\([^)]*\)/g, ' ')
            .split(/\s*(?:,|;|&|\/|\+|\ben\b|\band\b)\s*/i),
        )
        .map(normalizeName)
        .filter(
          (name) =>
            name.length >= 3 && name.split(' ').length <= MAX_NAME_WORDS,
        ),
    ),
  )

const sorted = (name: string) => name.split(' ').sort().join(' ')

const sameName = (left: string, right: string) => {
  if (similarity(left, right) >= NAME_SIMILARITY) return true

  // The same words in another order: "Yusuke Iwasaki" and "Iwasaki Yusuke"
  if (similarity(sorted(left), sorted(right)) >= NAME_SIMILARITY) return true

  // One name has more of the name than the other: "Patrick Tam" and
  // "Patrick Tam Kar-Ming"
  const leftWords = left.split(' ')
  const rightWords = right.split(' ')
  const [fewer, more] =
    leftWords.length <= rightWords.length
      ? [leftWords, rightWords]
      : [rightWords, leftWords]

  if (fewer.length >= 2 && fewer.every((word) => more.includes(word))) {
    return true
  }

  // "Dennis Villeneuve" and "D. Villeneuve", "Hirokazu Kore-eda" and
  // "Kore-eda Hirokazu": the same last name and the same initial
  const [leftFirst, ...leftRest] = left.split(' ')
  const [rightFirst, ...rightRest] = right.split(' ')
  const leftLast = leftRest.at(-1)
  const rightLast = rightRest.at(-1)

  return (
    leftLast !== undefined &&
    rightLast !== undefined &&
    leftLast.length >= 3 &&
    similarity(leftLast, rightLast) >= NAME_SIMILARITY &&
    leftFirst[0] === rightFirst[0]
  )
}

// Whether a candidate film has one of the directors the cinemas give for the
// screening. Unknown when either side doesn't have a director
export const compareDirectors = (
  cinemaDirectors: string[] = [],
  tmdbDirectors: string[] = [],
): DirectorMatch => {
  const cinemaNames = parseDirectorNames(cinemaDirectors)
  const tmdbNames = parseDirectorNames(tmdbDirectors)

  if (cinemaNames.length === 0 || tmdbNames.length === 0) return 'unknown'

  return cinemaNames.some((cinemaName) =>
    tmdbNames.some((tmdbName) => sameName(cinemaName, tmdbName)),
  )
    ? 'agree'
    : 'disagree'
}
