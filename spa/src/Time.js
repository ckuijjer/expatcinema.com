import React from 'react'
import { DateTime } from 'luxon'

class Time extends React.PureComponent {
  render() {
    return (
      <div style={{ fontSize: 20 }}>
        {this.props.children.toLocaleString(DateTime.TIME_24_SIMPLE)}
      </div>
    )
  }
}

export default Time
