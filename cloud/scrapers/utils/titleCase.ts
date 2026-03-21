const MINOR_WORDS = 'a an and as at by for from in of on or the to with'

// Basically \b with better unicode support, see https://stackoverflow.com/a/57290540/65971
// and extended it to not split on ' (e.g. I'm still here should not be split into I, '’, and m)
const UNICODE_BOUNDARY = /(?<=[\p{L}])(?=[^'\p{L}])|(?<=[^'\p{L}])(?=[\p{L}])/u

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
