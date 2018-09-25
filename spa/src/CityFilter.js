import React from 'react'
import styled from 'react-emotion'
import { view } from 'react-easy-state'
import { storage } from 'react-easy-params'

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

  // TODO: :hover stays turned on after clicking on mobile
  // ':hover': {
  //   color: '#0650d0',
  // },
}))

const toggle = city => {
  const set = new Set(storage.cities || [])

  if (set.has(city)) {
    set.delete(city)
  } else {
    set.add(city)
  }

  storage.cities = [...set].sort()
}

const CityFilter = () => (
  <Container>
    {cities.map(city => (
      <CityCheckbox
        key={city}
        onClick={() => toggle(city)}
        value={(storage.cities || []).includes(city)}
      >
        {city}
      </CityCheckbox>
    ))}
  </Container>
)

export default view(CityFilter)
