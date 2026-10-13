import React from 'react'

import { Screening } from '../utils/getScreenings'
import { Calendar } from './Calendar'
import { Layout } from './Layout'

export const App = ({
  screenings,
  showCity = true,
  currentCity,
  currentCinema,
}: {
  screenings: Screening[]
  showCity?: boolean
  currentCity?: string
  currentCinema?: string
}) => {
  return (
    <Layout as="main">
      <Calendar
        screenings={screenings}
        showCity={showCity}
        currentCity={currentCity}
        currentCinema={currentCinema}
      />
    </Layout>
  )
}
