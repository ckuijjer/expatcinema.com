import React from 'react'

import { palette } from '../utils/theme'
import { Calendar } from './Calendar'
import { CityFilter } from './CityFilter'
import { Layout } from './Layout'
import { NavigationBar } from './NavigationBar'

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
