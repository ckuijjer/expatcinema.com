import React from 'react'

import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

const App = ({ screenings }) => (
  <>
    <Header />
    <TextFilter />
    <CityFilter />
    <Calendar screenings={screenings} />
  </>
)

export default App
