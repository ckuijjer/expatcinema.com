// Letters that have no diacritic to remove: Unicode doesn't decompose them,
// so normalize('NFD') leaves them alone. They are written with ASCII letters
// the way people type them (Paweł → Pawel, Skovsbøl → Skovsbol, Cœur → Coeur)
const LETTERS: Record<string, string> = {
  ł: 'l',
  Ł: 'L',
  ø: 'o',
  Ø: 'O',
  đ: 'd',
  Đ: 'D',
  ð: 'd',
  Ð: 'D',
  ħ: 'h',
  Ħ: 'H',
  ı: 'i',
  ŧ: 't',
  Ŧ: 'T',
  ŋ: 'n',
  Ŋ: 'N',
  ĸ: 'k',
  ƒ: 'f',
  ſ: 's',
  ə: 'e',
  Ə: 'E',
  ß: 'ss',
  æ: 'ae',
  Æ: 'AE',
  œ: 'oe',
  Œ: 'OE',
  þ: 'th',
  Þ: 'Th',
}

const LETTERS_PATTERN = new RegExp(`[${Object.keys(LETTERS).join('')}]`, 'g')

export const removeDiacritics = (str: string): string =>
  str
    .replace(LETTERS_PATTERN, (letter) => LETTERS[letter])
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
