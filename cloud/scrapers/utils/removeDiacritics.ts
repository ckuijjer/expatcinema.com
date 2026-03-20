export const removeDiacritics = (str: string): string =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '')
