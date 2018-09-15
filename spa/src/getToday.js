import { DateTime } from 'luxon'

export default () => {
  const { year, month, day } = DateTime.fromMillis(Date.now())
  return DateTime.fromObject({ year, month, day })
}
