import React from 'react'
import styled from '@emotion/styled'
import Time from './Time'

const A = styled('a')({
  display: 'block',
  textDecoration: 'none',
  color: '#333',
  marginLeft: -10,
  marginRight: -10,
  height: 100,

  ':hover': {
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
  },
})

const Container = styled('div')({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [rest] auto',
  gridColumnGap: 12,
  lineHeight: 1.4,
  padding: 10,
})

const Title = styled('div')({
  fontSize: 20,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

const Cinema = styled('div')({
  fontSize: 16,
  gridColumnStart: 'rest',
  color: '#666',
})

const Screening = ({ url, date, title, cinema }) => (
  <A href={url}>
    <Container>
      <Time role="cell">{date}</Time>
      <Title role="cell">{title}</Title>
      <Cinema role="cell">
        {cinema.name}
        <br />
        {cinema.city}
      </Cinema>
    </Container>
  </A>
)

export default Screening
