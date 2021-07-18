import React from 'react'
import * as Plot from '@observablehq/plot'

const Analytics = ({ points }) => {
  const svg = Plot.plot({
    marks: [Plot.line(points, { x: 'createdAt', y: 'count', z: 'scraper' })],
  })

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: svg.outerHTML,
      }}
    ></div>
  )
}

export default Analytics
