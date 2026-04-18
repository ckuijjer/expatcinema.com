import React from 'react'

import { css } from 'styled-system/css'

import { pageContentStyle } from './Layout'

const fullBleedStyle = css({
  width: '100vw',
  marginLeft: 'calc(50% - 50vw)',
  marginRight: 'calc(50% - 50vw)',
})

type FullBleedSectionProps = {
  backgroundColor?: string
  children: React.ReactNode
}

export const FullBleedSection = ({
  backgroundColor,
  children,
}: FullBleedSectionProps) => {
  return (
    <div style={{ backgroundColor }} className={fullBleedStyle}>
      <div className={pageContentStyle}>{children}</div>
    </div>
  )
}
