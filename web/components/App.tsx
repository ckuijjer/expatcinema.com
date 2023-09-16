import React from 'react'

import Calendar from './Calendar'
import CityFilter from './CityFilter'
import Layout from './Layout'
import Header from './Header'

const App = ({ screenings, showCity = true }) => {
  return (
    <>
      <Layout>
        <Header />
      </Layout>
      <Layout inverse>
        <CityFilter />
      </Layout>
      <Layout>
        <Calendar screenings={screenings} showCity={showCity} />
      </Layout>
    </>
  )
}

export default App
