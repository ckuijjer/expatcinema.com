import { DateTime } from 'luxon'
import React from 'react'

export class Time extends React.PureComponent<{ children: DateTime }> {
  render() {
    return (
      <div style={{ fontSize: 18 }}>
        {this.props.children
          .setZone('Europe/Amsterdam')
          .toLocaleString(DateTime.TIME_24_SIMPLE, { locale: 'en-GB' })}
      </div>
    )
  }
}
