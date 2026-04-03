import { DateTime } from 'luxon'
import React from 'react'
import { css } from 'styled-system/css'

const timeStyle = css({ fontSize: '18px' })

export class Time extends React.PureComponent<{ children: DateTime }> {
  render() {
    return (
      <div className={timeStyle}>
        {this.props.children
          .setZone('Europe/Amsterdam')
          .toLocaleString(DateTime.TIME_24_SIMPLE, { locale: 'en-GB' })}
      </div>
    )
  }
}
