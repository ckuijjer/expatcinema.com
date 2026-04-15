import { removeDiacritics } from './removeDiacritics'

export const slugifyMovieTitle = (title: string) =>
  removeDiacritics(title)
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
