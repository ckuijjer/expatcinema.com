import { titleCase } from '../utils/titleCase'

const FILMHUIS_NOISE_SUFFIXES = [
  /(?:\s+-\s+Laff)$/i,
  /(?:\s+-\s+Drank & Drugs)$/i,
  /(?:\s+-\s+This Is Not Funny)$/i,
  /(?:\s+-\s+Is This Bruce Lee\?)$/i,
  /(?:\s+-\s+Ciné Première)$/i,
  /(?:\s+-\s+Late Night Anime)$/i,
  /(?:\s+-\s+En Subs(?:\s+Met\s+(?:Introductie|Inleiding|Nagesprek))?)$/i,
  /(?:\s+-\s+Met\s+(?:Introductie|Inleiding|Nagesprek))$/i,
]

export const cleanFilmhuisDenHaagTitle = (title: string) =>
  titleCase(
    (() => {
      let cleaned = title
      let previous: string

      do {
        previous = cleaned
        cleaned = FILMHUIS_NOISE_SUFFIXES.reduce((current, suffix) => {
          return current.replace(suffix, '')
        }, cleaned)
        cleaned = cleaned
          .replace(/ - EN subs$/i, '')
          .replace(
            /\s+\((?:4K Restoration|Re-Release)\)(?:\s+-\s+Late Night Anime)?$/i,
            '',
          )
          .trim()
      } while (cleaned !== previous)

      return cleaned
    })(),
  )
