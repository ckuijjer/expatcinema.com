import React from 'react'
import { graphql } from 'gatsby'

import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
import Header from './Header'

const App = ({ screenings, showCity = true }) => (
  <>
    <Header />
    <TextFilter />
    <CityFilter />
    <Calendar screenings={screenings} showCity={showCity} />
  </>
)

export const query = graphql`
  fragment AppScreening on Screening {
    date
    cinema {
      name
      city {
        name
      }
    }
    title
    url
  }
`

export default App
