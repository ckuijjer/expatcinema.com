import { DateTime } from 'luxon'

const getToday = () => {
  const { year, month, day } = DateTime.local()
  return DateTime.fromObject({ year, month, day })
}

export default getToday
