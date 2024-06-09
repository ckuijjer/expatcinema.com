const MINOR_WORDS = 'a an and as at by for from in of on or the to with'

const isRomanNumeral = (word: string) => {
  return /^[IVXLCDM]+$/.test(word)
}

const capitalize = (word: string) => {
  if (isRomanNumeral(word)) {
    return word
  } else {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }
}

export const titleCase = (input: string) => {
  const listOfMinorWords = MINOR_WORDS.split(' ').map((w) => w.toLowerCase())

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
