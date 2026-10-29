'use client'

import Image from 'next/image'
import React, { useRef, useState } from 'react'

import { css } from 'styled-system/css'

const thumbnail = {
  position: 'relative',
  flex: '1 1 0',
  boxSizing: 'border-box',
  height: '100%',
  minWidth: '0',
  padding: '0',
  overflow: 'hidden',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--background-highlight-color)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const thumbnailStyle = css(thumbnail)

// Without a backdrop the thumbnail is the highlight color on the page color, so
// the border and the label are what show where it is
const plainThumbnailStyle = css(thumbnail, {
  border: '1px solid var(--text-subtle-color)',
})

const backdropStyle = css({
  objectFit: 'cover',
})

const playIconStyle = css({
  position: 'relative',
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  color: 'var(--text-inverse-color)',
  border: '2px solid var(--text-inverse-color)',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  paddingLeft: '3px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
})

const label = {
  position: 'absolute',
  left: '8px',
  bottom: '6px',
  fontSize: '12px',
  fontWeight: '700',
  color: 'white',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
}

const labelStyle = css(label)

const plainLabelStyle = css(label, {
  color: 'var(--text-muted-color)',
  textShadow: 'none',
})

const dialogStyle = css({
  width: 'min(960px, 92vw)',
  aspectRatio: '16 / 9',
  padding: '0',
  border: 'none',
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: 'black',
  '&::backdrop': { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
})

const frameStyle = css({
  width: '100%',
  height: '100%',
  border: '0',
  display: 'block',
})

const closeStyle = css({
  position: 'absolute',
  top: '8px',
  right: '8px',
  zIndex: '1',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  fontSize: '18px',
  cursor: 'pointer',
})

// A small thumbnail that plays the trailer in a dialog when clicked. The YouTube
// player is about 4 MB, so it is only added while the dialog is open.
export const TrailerEmbed = ({
  videoKey,
  title,
  backdropUrl,
}: {
  videoKey: string
  title: string
  backdropUrl?: string
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = () => {
    setIsOpen(true)
    dialogRef.current?.showModal()
  }

  const close = () => dialogRef.current?.close()

  return (
    <>
      <button
        type="button"
        className={backdropUrl ? thumbnailStyle : plainThumbnailStyle}
        onClick={open}
        aria-label={`Play trailer for ${title}`}
      >
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt=""
            fill
            sizes="540px"
            className={backdropStyle}
          />
        ) : null}
        <span className={playIconStyle} aria-hidden>
          ▶
        </span>
        <span
          className={backdropUrl ? labelStyle : plainLabelStyle}
          aria-hidden
        >
          Trailer
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className={dialogStyle}
        aria-label={`Trailer for ${title}`}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
      >
        {isOpen ? (
          <>
            <button
              type="button"
              className={closeStyle}
              onClick={close}
              aria-label="Close trailer"
            >
              ✕
            </button>
            <iframe
              className={frameStyle}
              src={`https://www.youtube-nocookie.com/embed/${videoKey}?rel=0&autoplay=1`}
              title={`Trailer for ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </>
        ) : null}
      </dialog>
    </>
  )
}
