const MINOR_WORDS = 'a an and as at by for from in of on or the to with'

// Basically \b with better unicode support, see https://stackoverflow.com/a/57290540/65971
// and extended it to not split on ' (e.g. I'm still here should not be split into I, '’, and m)
// Digits stay together with the letters right after them (30th, 5tory, 35mm), so those
// letters aren't split off and capitalized as a word of their own (30Th)
const UNICODE_BOUNDARY =
  /(?<=[\p{L}])(?=[^'\p{L}])|(?<=[^'\p{L}\p{N}])(?=[\p{L}])|(?<=[^'\p{L}\p{N}])(?=\p{N}+\p{L})/u

// A number directly followed by letters, e.g. 30th, 2nd, 35mm, 3D, 4K, 5tory
const NUMBER_WITH_LETTERS = /^(\d+)(\p{L}+)$/u

// Letters after a number are lowercase (30th, 35mm, 5tory), except for the
// dimensions and resolutions that are written in capitals (3D, 4K)
const numberWithLetters = (digits: string, letters: string) =>
  /^[dk]$/i.test(letters)
    ? digits + letters.toUpperCase()
    : digits + letters.toLowerCase()

const isRomanNumeral = (word: string) => {
  // Matches valid Roman numerals 1–3999 (I through MMMCMXCIX)
  return (
    word.length > 0 &&
    /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(word)
  )
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
    .trim() // remove leading and trailing spaces
    .replace(/’/g, "'") // replace all fancy apostrophes with normal ones
    .split(UNICODE_BOUNDARY)
    .map((word, i) => {
      if (isAllSpaces(word)) {
        return ' '
      }

      const numberWithLettersMatch = word.match(NUMBER_WITH_LETTERS)
      if (numberWithLettersMatch) {
        return numberWithLetters(
          ...(numberWithLettersMatch.slice(1) as [string, string]),
        )
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
