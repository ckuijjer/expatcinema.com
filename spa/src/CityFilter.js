import React from 'react'
import styled from 'react-emotion'

import { cinemas } from './data'

const cities = [...new Set(cinemas.map(x => x.city).sort())]

const Container = styled('div')({
  marginTop: 12,
  marginBottom: 12,
})

const CityCheckbox = styled('div')(({ value }) => ({
  display: 'inline-block',
  fontSize: 24,
  color: value ? '#0650d0' : '#aaa',
  paddingRight: 8,
  cursor: 'pointer',

  ':hover': {
    color: '#0650d0',
  },
}))

class CityFilter extends React.Component {
  state = {
    selected: [],
  }

  toggle = city => {
    this.setState(({ selected }) => {
      const set = new Set(selected)

      if (set.has(city)) {
        set.delete(city)
      } else {
        set.add(city)
      }

      const newSelected = [...set].sort()

      // TODO: this is really wrong, likely the CityFilter needs to become fully controlled, or it needs
      // to start using Redux
      this.props.onChange(newSelected)

      return {
        selected: newSelected,
      }
    })
  }

  render() {
    return (
      <Container>
        {cities.map(city => (
          <CityCheckbox
            key={city}
            onClick={() => this.toggle(city)}
            value={this.state.selected.includes(city)}
          >
            {city}
          </CityCheckbox>
        ))}
      </Container>
    )
  }
}

export default CityFilter
