const MINOR_WORDS = 'a an and as at by for from in of on or the to with'

const isRomanNumeral = (word: string) => {
  return /^[IVXLCDM]+$/.test(word) // FIXME: This is not correct, e.g. 'IXVI' is not a valid roman numeral
}

const isAllSpaces = (word: string) => {
  return /^\s+$/.test(word)
}

const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export const titleCase = (input: string) => {
  const listOfMinorWords = MINOR_WORDS.split(' ').map((w) => w.toLowerCase())

  return input
    .split(/\b/)
    .map((word, i) => {
      if (isAllSpaces(word)) {
        return ' '
      }

      if (isRomanNumeral(word)) {
        return word
      }

      if (i !== 0 && listOfMinorWords.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }

      return capitalize(word)
    })
    .join('')
}
