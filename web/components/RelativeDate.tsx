'use client'

import { DateTime } from 'luxon'

import { css, cx } from 'styled-system/css'

import { getToday } from '../utils/getToday'
import { headerFont } from '../utils/theme'

const dateStyle = css({
  fontSize: '16px',
  fontWeight: '700',
  margin: '12px 0',
})

export const RelativeDate = ({ children }: { children: string }) => {
  const date = DateTime.fromISO(children)
  const today = getToday()

  const diff = date.diff(today, 'days').days

  let relativeDate = date.toFormat('EEEE d MMMM')
  if (diff === 0) {
    relativeDate = 'Today'
  } else if (diff === 1) {
    relativeDate = 'Tomorrow'
  }

  return <h3 className={cx(dateStyle, headerFont.className)}>{relativeDate}</h3>
}
