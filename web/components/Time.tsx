import { DateTime } from 'luxon'
import React from 'react'
import { css } from 'styled-system/css'

const timeStyle = css({ fontSize: '18px' })

export const Time = ({ children }: { children: DateTime }) => {
  return (
    <div className={timeStyle}>
      {children
        .setZone('Europe/Amsterdam')
        .toLocaleString(DateTime.TIME_24_SIMPLE, { locale: 'en-GB' })}
    </div>
  )
}
