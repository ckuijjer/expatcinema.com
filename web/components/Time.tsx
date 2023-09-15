import React from 'react'
import { DateTime } from 'luxon'

class Time extends React.PureComponent {
  render() {
    // TODO: Format in the Europe/Amsterdam timezone with English locale here
    return (
      <div style={{ fontSize: 18 }}>
        {this.props.children.toLocaleString(DateTime.TIME_24_SIMPLE)}
      </div>
    )
  }
}

export default Time
