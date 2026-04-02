import { DateTime } from 'luxon'
import Image from 'next/image'
import React from 'react'

import { css } from 'styled-system/css'

import { Cinema } from '../utils/getScreenings'
import { Time } from './Time'

const aStyle = css({
  display: 'block',
  textDecoration: 'none',
  color: 'var(--text-color)',
  marginLeft: '-12px',
  marginRight: '-12px',
  _hover: {
    backgroundColor: 'var(--background-highlight-color)',
    borderRadius: '10px',
  },
})

const containerStyle = css({
  display: 'grid',
  gridTemplateColumns: '[time] 60px [rest] auto',
  gridColumnGap: '12px',
  lineHeight: '1.5',
  padding: '12px',
})

const titleStyle = css({
  fontSize: '18px',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

const cinemaInfoStyle = css({
  fontSize: '14px',
  gridColumnStart: 'rest',
  color: 'var(--text-muted-color)',
  display: 'flex',
  alignItems: 'center',
})

const cinemaIconStyle = css({
  filter: 'grayscale(100%) opacity(0.5)',
  marginRight: '4px',
  display: 'inline',
})

type CinemaIconProps = {
  cinema: Cinema
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
      className={cinemaIconStyle}
    />
  )
}

export const ScreeningRow = ({
  url,
  date,
  title,
  cinema,
  showCity = true,
}: {
  url: string
  date: DateTime
  title: string
  cinema: Cinema
  showCity?: boolean
}) => {
  return (
    <a href={url} className={aStyle}>
      <div className={containerStyle}>
        <Time>{date}</Time>
        <div className={titleStyle}>{title}</div>
        <div className={cinemaInfoStyle}>
          <CinemaIcon cinema={cinema} />
          {cinema.name}
          {showCity ? <> | {cinema.city.name}</> : null}
        </div>
      </div>
    </a>
  )
}
