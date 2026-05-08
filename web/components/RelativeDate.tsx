'use client'

import { DateTime } from 'luxon'

import { getToday } from '../utils/getToday'
import { listSectionHeadingStyle } from './listStyles'

export const RelativeDate = ({ children }: { children: string }) => {
  const date = DateTime.fromISO(children, { zone: 'Europe/Amsterdam' })
  const today = getToday()

  const diff = date.diff(today, 'days').days

  const fullDate = date.toFormat('EEEE d MMMM')
  let relativeDate = fullDate
  if (diff === 0) {
    relativeDate = `Today \u2013 ${fullDate}`
  } else if (diff === 1) {
    relativeDate = `Tomorrow \u2013 ${fullDate}`
  }

  return <h3 id={children} className={listSectionHeadingStyle}>{relativeDate}</h3>
}
