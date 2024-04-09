import { Screening } from '../../types'
import { sortScreenings } from './sortScreenings'
import { uniq } from './uniq'

export const makeScreeningsUniqueAndSorted = (screenings: Screening[]) => {
  return uniq(sortScreenings(screenings))
}
