import React from 'react'

import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

const App = ({ screenings, showCity = true }) => {
  return (
    <>
      <Header />
      <CityFilter />
      <Calendar screenings={screenings} showCity={showCity} />
    </>
  )
}

export default App
