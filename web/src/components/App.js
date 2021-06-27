import React from 'react'

import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

const App = () => (
  <>
    <Header />
    <TextFilter />
    <CityFilter />
    <Calendar />
  </>
)

export default App
