import { DateTime } from 'luxon'

export const getToday = () => {
  const { year, month, day } = DateTime.local()
  return DateTime.fromObject({ year, month, day })
}
