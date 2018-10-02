import { DateTime } from 'luxon'

export default () => {
  const { year, month, day } = DateTime.local()
  return DateTime.fromObject({ year, month, day })
}
