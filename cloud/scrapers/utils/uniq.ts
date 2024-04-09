import { isDeepStrictEqual } from 'util'

export const uniq = <T>(list: T[]): T[] =>
  list.filter(
    (item, index) =>
      list.findIndex((i) => isDeepStrictEqual(i, item)) === index,
  )
