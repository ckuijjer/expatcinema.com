import React from 'react'

import { css } from 'styled-system/css'

import { Screening } from '../utils/getScreenings'
import { Calendar } from './Calendar'
import { Layout } from './Layout'
import { PageTitle } from './PageTitle'

const pageStyle = css({
  display: 'grid',
  rowGap: '16px',
})

const introStyle = css({
  marginTop: '0',
  marginBottom: '0',
  maxWidth: '760px',
  fontSize: '16px',
  lineHeight: '1.6',
  color: 'var(--text-muted-color)',
})

export const App = ({
  screenings,
  showCity = true,
  currentCity,
  currentCinema,
  title,
  intro,
}: {
  screenings: Screening[]
  showCity?: boolean
  currentCity?: string
  currentCinema?: string
  title?: string
  intro?: string
}) => {
  return (
    <Layout>
      <div className={pageStyle}>
        {title || intro ? (
          <div>
            {title ? <PageTitle>{title}</PageTitle> : null}
            {intro ? <p className={introStyle}>{intro}</p> : null}
          </div>
        ) : null}
        <Calendar
          screenings={screenings}
          showCity={showCity}
          currentCity={currentCity}
          currentCinema={currentCinema}
        />
      </div>
    </Layout>
  )
}
