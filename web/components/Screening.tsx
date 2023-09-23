import React from 'react'
import { css } from '@emotion/react'
import Image from 'next/image'
import { Cinema as CinemaType } from '../utils/getScreenings'

import Time from './Time'

const A = ({ href, children }) => {
  return (
    <a
      href={href}
      css={css({
        display: 'block',
        textDecoration: 'none',
        color: 'var(--text-color)',
        marginLeft: -10,
        marginRight: -10,

        ':hover': {
          backgroundColor: 'var(--background-highlight-color)',
          borderRadius: 10,
        },
      })}
    >
      {children}
    </a>
  )
}

const Container = (props) => (
  <div
    css={css({
      display: 'grid',
      gridTemplateColumns: '[time] 60px [rest] auto',
      gridColumnGap: 12,
      lineHeight: 1.5,
      padding: 10,
    })}
    {...props}
  />
)

const Title = (props) => (
  <div
    css={css({
      fontSize: 18,
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
      fontSize: 14,
      gridColumnStart: 'rest',
      color: 'var(--text-muted-color)',
      display: 'flex',
      alignItems: 'center',
    })}
    {...props}
  />
)

type CinemaIconProps = {
  cinema: CinemaType
}

const CinemaIcon = ({ cinema }: CinemaIconProps) => {
  if (!cinema.logo) {
    return null
  }

  return (
    <Image
      src={`/images/${cinema.logo}`}
      width={16}
      height={16}
      alt={`Logo for ${cinema.name}`}
      css={css({
        filter: 'grayscale(100%) opacity(0.5)',
        marginRight: 4,
        display: 'inline',
      })}
    />
  )
}

const Screening = ({ url, date, title, cinema, showCity = true }) => {
  return (
    <A href={url}>
      <Container>
        <Time>{date}</Time>
        <Title>{title}</Title>
        <Cinema>
          <CinemaIcon cinema={cinema} />
          {cinema.name}
          {showCity ? <> | {cinema.city.name}</> : null}
        </Cinema>
      </Container>
    </A>
  )
}

export default Screening
