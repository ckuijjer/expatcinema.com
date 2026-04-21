import { DateTime } from 'luxon'

export const getToday = () => {
  return DateTime.now().setZone('Europe/Amsterdam').startOf('day')
}
