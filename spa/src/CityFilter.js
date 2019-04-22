import React from 'react'
import styled from '@emotion/styled'

import { useLocalStorage } from './hooks'
import { cinemas } from './data'

const allCities = [...new Set(cinemas.map(x => x.city).sort())]

const Container = styled('div')({
  marginTop: 12,
  marginBottom: 12,
})

const CityCheckbox = styled('div')(({ value }) => ({
  display: 'inline-block',
  fontSize: 24,
  color: value ? '#0650d0' : '#888',
  paddingRight: 8,
  cursor: 'pointer',

  // TODO: :hover stays turned on after clicking on mobile
  // ':hover': {
  //   color: '#0650d0',
  // },
}))

const CityFilter = () => {
  const [cities, setCities] = useLocalStorage('cities', [])

  const toggle = city => {
    const set = new Set(cities || [])

    if (set.has(city)) {
      set.delete(city)
    } else {
      set.add(city)
    }

    setCities([...set].sort())
  }

  return (
    <Container>
      {allCities.map(city => (
        <CityCheckbox
          key={city}
          onClick={() => toggle(city)}
          value={(cities || []).includes(city)}
        >
          {city}
        </CityCheckbox>
      ))}
    </Container>
  )
}

export default CityFilter
