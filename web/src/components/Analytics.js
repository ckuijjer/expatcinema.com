import React from 'react'
import * as Plot from '@observablehq/plot'
import { css } from '@emotion/react'

const Analytics = ({ points }) => {
  const [highlight, setHighlight] = React.useState(null)

  const sortedPoints = [...points].sort((a, b) => {
    if (a.scraper === highlight) return 1
    if (b.scraper === highlight) return -1
    return 0
  })

  const scrapers = [...new Set(points.map((x) => x.scraper))]

  const svg = Plot.plot({
    marks: [
      Plot.line(sortedPoints, {
        x: 'createdAt',
        y: 'value',
        z: 'scraper',
        curve: 'bump-x',
        stroke: 'scraper',
        strokeWidth: 2,
      }),
    ],
    y: {
      label: '',
    },
    x: {
      label: '',
      transform: (d) => new Date(d),
      tickFormat: (d) => d.toLocaleDateString(),
    },
    color: {
      range: (x) =>
        x.map((scraper) => {
          if (!highlight) {
            // If no highlight, use the default color
            return 'currentColor'
          } else {
            // If a scraper is highlighted, use the primary color and make the other scrapers less visible
            return scraper === highlight ? '#0650D0' : '#ddd'
          }
        }),
    },
    grid: true,
    width: 960,
    style: {
      overflow: 'visible',
      color: '#888',
      fontSize: 10,
    },
  })

  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: svg.outerHTML,
        }}
      ></div>
      <div
        css={css({
          cursor: 'pointer',
          color: highlight === null ? '#0650D0' : '#888',
          padding: 4,
          marginBottom: 8,
        })}
        onClick={() => setHighlight(null)}
      >
        no highlight
      </div>
      <div>
        {scrapers.map((scraper) => (
          <div
            css={css({
              cursor: 'pointer',
              color: highlight === scraper ? '#0650D0' : '#888',
              padding: 4,
            })}
            onClick={() => setHighlight(scraper)}
          >
            {scraper}
          </div>
        ))}
      </div>
    </>
  )
}

export default Analytics
