import React from 'react'
import { css } from '@emotion/react'

import Time from './Time'

const A = (props) => (
  <a
    css={css({
      display: 'block',
      textDecoration: 'none',
      color: '#333',
      marginLeft: -10,
      marginRight: -10,

      ':hover': {
        backgroundColor: '#f6f6f6',
        borderRadius: 10,
      },
    })}
    {...props}
  />
)

const Container = (props) => (
  <div
    css={css({
      display: 'grid',
      gridTemplateColumns: '[time] 60px [rest] auto',
      gridColumnGap: 12,
      lineHeight: 1.4,
      padding: 10,
    })}
    {...props}
  />
)

const Title = (props) => (
  <div
    css={css({
      fontSize: 20,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    })}
    {...props}
  />
)

const Cinema = (props) => (
  <div
    css={css({
      fontSize: 16,
      gridColumnStart: 'rest',
      color: '#666',
    })}
    {...props}
  />
)

const Screening = ({ url, date, title, cinema, showCity = true }) => (
  <A href={url}>
    <Container>
      <Time>{date}</Time>
      <Title>{title}</Title>
      <Cinema>
        {cinema.name}
        {showCity ? (
          <>
            <br />
            {cinema.city.name}
          </>
        ) : null}
      </Cinema>
    </Container>
  </A>
)

export default Screening
