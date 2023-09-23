import React from 'react'

import Calendar from './Calendar'
import CityFilter from './CityFilter'
import Layout from './Layout'
import Header from './Header'
import { palette } from '../utils/theme'

const App = ({ screenings, showCity = true }) => {
  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <Header />
      </Layout>
      <Layout backgroundColor={palette.purple400}>
        <CityFilter />
      </Layout>
      <Layout>
        <Calendar screenings={screenings} showCity={showCity} />
      </Layout>
    </>
  )
}

export default App
