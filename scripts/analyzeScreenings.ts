import diacritics from 'diacritics'
import { readFile } from 'fs/promises'

export type Screening = {
  title: string
  url: string
  cinema: string
  date: Date
}

const readJson = async (file) => {
  const json = await readFile(`../data/screenings/${file}`, 'utf-8')
  return JSON.parse(json)
}

const normalizeTitle = (title: string) =>
  titleCase(diacritics.remove(title), MINOR_WORDS)

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

const titleCase = (input: string, minorWords = '') => {
  const listOfMinorWords = minorWords.split(' ').map((w) => w.toLowerCase())

  return input
    .split(/\s+/)
    .map((word, i) => {
      if (i !== 0 && listOfMinorWords.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }

      return capitalize(word)
    })
    .join(' ')
}

const MINOR_WORDS = 'a an and as at by for from in of on or the to with'

const compareTitles = (a: string, b: string) =>
  normalizeTitle(a).localeCompare(normalizeTitle(b))

const screeningsWithMetadata: Screening[] = await readJson(
  'screenings-with-metadata.json',
)
const screeningsWithoutMetadata: Screening[] = await readJson(
  'screenings-without-metadata.json',
)

const screeningsGroupedByTitle = Object.groupBy(
  screeningsWithoutMetadata,
  (screening: Screening) => normalizeTitle(screening.title),
)

const containsYear = (title: string) => /\(\d{4}\)/.test(title)
const containsColon = (title: string) => /:/.test(title)
const containsDash = (title: string) => /-/.test(title)

const numberToEmoji = (number: number) => {
  const emojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
  return number
    .toString()
    .split('')
    .map((digit) => `${emojis[parseInt(digit)]} `)
    .join('')
}

Object.entries(screeningsGroupedByTitle)
  .toSorted((a, b) => compareTitles(a[0], b[0]))
  .filter(([normalizedTitle]) => {
    return [
      () => true,
      containsDash,
      //       containsColon,
      containsYear,
    ].some((condition) => condition(normalizedTitle))
  })
  .forEach(([normalizedTitle, screenings]) => {
    const uniqueCinemas = [...new Set(screenings.map((s) => s.cinema))]

    console.log(
      `${normalizedTitle} ${numberToEmoji(screenings.length)} ${uniqueCinemas.join(', ')} ${numberToEmoji(uniqueCinemas.length)}`,
    )
  })
