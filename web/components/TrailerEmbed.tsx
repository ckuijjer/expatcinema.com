'use client'

import Image from 'next/image'
import React, { useState } from 'react'

import { css } from 'styled-system/css'

const embedStyle = css({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--background-highlight-color)',
  maxWidth: '960px',
})

const fillStyle = css({
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  border: '0',
})

const playButtonStyle = css({
  padding: '0',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const backdropStyle = css({
  objectFit: 'cover',
})

const playIconStyle = css({
  position: 'relative',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: 'var(--background-inverse-color)',
  color: 'var(--text-inverse-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  paddingLeft: '4px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
})

// The YouTube player is about 4 MB, so it only loads when the trailer is played
export const TrailerEmbed = ({
  videoKey,
  title,
  backdropUrl,
}: {
  videoKey: string
  title: string
  backdropUrl?: string
}) => {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className={embedStyle}>
      {isPlaying ? (
        <iframe
          className={fillStyle}
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?rel=0&autoplay=1`}
          title={`Trailer for ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className={`${fillStyle} ${playButtonStyle}`}
          onClick={() => setIsPlaying(true)}
          aria-label={`Play trailer for ${title}`}
        >
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt=""
              fill
              sizes="(max-width: 960px) 100vw, 960px"
              className={backdropStyle}
            />
          ) : null}
          <span className={playIconStyle} aria-hidden>
            ▶
          </span>
        </button>
      )}
    </div>
  )
}
