import React from 'react'
import { DateTime } from 'luxon'
import getToday from './getToday'

class RelativeDate extends React.PureComponent {
  render() {
    const date = DateTime.fromISO(this.props.children)
    const today = getToday()

    const diff = date.diff(today, 'days').days

    // today
    // tomorrow
    // thursday 20 september
    let relativeDate = date.toFormat('EEEE d MMMM')
    if (diff === 0) {
      relativeDate = 'Today'
    } else if (diff === 1) {
      relativeDate = 'Tomorrow'
    }

    return <h3>{relativeDate}</h3>
  }
}

export default RelativeDate
