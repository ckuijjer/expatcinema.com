import React from 'react'

import { SHOW_CINEMA_FILTER_ON_ALL_CITIES } from '../utils/featureFlags'
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
  // To try the "always show cinema filter" behaviour, set SHOW_CINEMA_FILTER_ON_ALL_CITIES
  // to true in featureFlags.ts and pass currentCity from pages/index.tsx as well.
  const showCinemaFilter =
    SHOW_CINEMA_FILTER_ON_ALL_CITIES || currentCity !== undefined

  return (
    <>
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar />
      </Layout>
      <Layout backgroundColor={palette.purple400}>
        <CityFilter />
      </Layout>
      {showCinemaFilter && currentCity !== undefined && (
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
