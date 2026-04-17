'use client'

import React from 'react'

import { useSelectedLayoutSegment } from 'next/navigation'

export const HideOnMovieRoute = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const segment = useSelectedLayoutSegment()

  if (segment === 'movie') {
    return null
  }

  return <>{children}</>
}
