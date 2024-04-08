import { css } from '@emotion/react'
import Image from 'next/image'
import React from 'react'

import { Cinema as CinemaType } from '../utils/getScreenings'
import { Time } from './Time'

const A = ({ href, children }) => {
  return (
    <a
      href={href}
      css={css`
        display: block;
        text-decoration: none;
        color: var(--text-color);
        margin-left: -12px;
        margin-right: -12px;

        &:hover {
          background-color: var(--background-highlight-color);
          border-radius: 10px;
        }
      `}
    >
      {children}
    </a>
  )
}

const Container = (props) => (
  <div
    css={css`
      display: grid;
      grid-template-columns: [time] 60px [rest] auto;
      grid-column-gap: 12px;
      line-height: 1.5;
      padding: 12px;
    `}
    {...props}
  />
)

const Title = (props) => (
  <div
    css={css`
      font-size: 18px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    `}
    {...props}
  />
)

const Cinema = (props) => (
  <div
    css={css`
      font-size: 14px;
      grid-column-start: rest;
      color: var(--text-muted-color);
      display: flex;
      align-items: center;
    `}
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
      css={css`
        filter: grayscale(100%) opacity(0.5);
        margin-right: 4px;
        display: inline;
      `}
    />
  )
}

export const Screening = ({ url, date, title, cinema, showCity = true }) => {
  return (
    <A href={url}>
      <Container>
        <Time>{date}</Time>
        <Title>{title}</Title>
        {/* {showCity ? <Cinema>{cinema.city.name}</Cinema> : null} */}
        <Cinema>
          <CinemaIcon cinema={cinema} />
          {cinema.name}
          {showCity ? <> | {cinema.city.name}</> : null}
        </Cinema>
      </Container>
    </A>
  )
}
