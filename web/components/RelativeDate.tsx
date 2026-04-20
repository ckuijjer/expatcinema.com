'use client'

import { DateTime } from 'luxon'

import { getToday } from '../utils/getToday'
import { listSectionHeadingStyle } from './listStyles'

export const RelativeDate = ({ children }: { children: string }) => {
  const date = DateTime.fromISO(children, { zone: 'Europe/Amsterdam' })
  const today = getToday()

  const diff = date.diff(today, 'days').days

  let relativeDate = date.toFormat('EEEE d MMMM')
  if (diff === 0) {
    relativeDate = 'Today'
  } else if (diff === 1) {
    relativeDate = 'Tomorrow'
  }

  return <h3 className={listSectionHeadingStyle}>{relativeDate}</h3>
}
