import React from 'react'

import { Screening } from '../utils/getScreenings'
import { palette } from '../utils/theme'
import { Calendar } from './Calendar'
import { CinemaFilter } from './CinemaFilter'
import { CityFilter } from './CityFilter'
import { Layout } from './Layout'
import { NavigationBar } from './NavigationBar'

export const App = ({
  screenings,
  showCity = true,
  currentCity,
  currentCinema: _currentCinema,
}: {
  screenings: Screening[]
  showCity?: boolean
  currentCity?: string
  currentCinema?: string
}) => {
  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar />
      </Layout>
      <Layout backgroundColor={palette.purple400}>
        <CityFilter />
      </Layout>
      {currentCity !== undefined && (
        <Layout backgroundColor={palette.purple300}>
          <CinemaFilter currentCity={currentCity} />
        </Layout>
      )}
      <Layout>
        <Calendar screenings={screenings} showCity={showCity} />
      </Layout>
    </>
  )
}
