import React from 'react'

import { Calendar } from './Calendar'
import { CityFilter } from './CityFilter'
import { Layout } from './Layout'
import { NavigationBar } from './NavigationBar'
import { palette } from '../utils/theme'

export const App = ({ screenings, showCity = true }) => {
  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar />
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
