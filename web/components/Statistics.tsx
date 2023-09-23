import React from 'react'
import * as Plot from '@observablehq/plot'
import { css } from '@emotion/react'
import Layout from './Layout'

// Grid component that has cells with a width of 200px and using css grid layout
const Grid = ({ children }) => (
  <div
    css={css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      grid-gap: 12px;
    `}
  >
    {children}
  </div>
)

const Tile = ({
  title,
  value,
  onClick = () => {},
  isHighlighted = false,
  isDimmed = false,
}) => {
  const color = isHighlighted
    ? 'var(--primary-color)'
    : isDimmed
    ? 'var(--text-muted-color)'
    : 'var(--text-color)'

  return (
    <div
      css={css`
        padding: 16px;
        border-style: solid;
        border-radius: 4px;
        border-width: 1px;
        border-color: ${color};
        color: ${color};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `}
      onClick={onClick}
    >
      <div
        css={css`
          font-size: 48px;
          margin-bottom: 8px;
          font-weight: bold;
        `}
      >
        {value}
      </div>
      <div
        css={css`
          font-size: 18px;
        `}
      >
        {title}
      </div>
    </div>
  )
}

const Statistics = ({ points }) => {
  const [highlight, setHighlight] = React.useState(null)

  const sortedPoints = [...points].sort((a, b) => {
    if (a.scraper === highlight) return 1
    if (b.scraper === highlight) return -1
    return 0
  })

  const scrapers = [...new Set(points.map((x) => x.scraper))]

  // in points get latest value per scraper
  const latestValuePerScraper = scrapers
    .map((scraper) => {
      const latest = points
        .filter((x) => x.scraper === scraper)
        .reduce((acc, x) => {
          if (x.createdAt > acc.createdAt || !acc.createdAt) return x
          return acc
        }, {})
      return { scraper, value: latest.value }
    })
    .sort((a, b) => b.value - a.value)

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
            return scraper === highlight
              ? 'var(--primary-color)'
              : 'var(--text-muted-color)'
          }
        }),
    },
    grid: true,
    width: 960,
    style: {
      overflow: 'visible',
      color: 'var(--text-color)',
      background: 'var(--background-color)',
      fontSize: '10px',
    },
  })

  const isHighlighted = (scraper) => scraper === highlight

  const handleTileClick = (scraper) => () => {
    if (isHighlighted(scraper)) {
      setHighlight(null)
    } else {
      setHighlight(scraper)
    }
  }

  return (
    <Layout>
      <div
        dangerouslySetInnerHTML={{
          __html: svg.outerHTML,
        }}
        css={css`
          margin-top: 32px;
          margin-bottom: 32px;
        `}
      ></div>
      <Grid>
        {latestValuePerScraper.map(({ scraper, value }) => (
          <Tile
            value={value}
            title={scraper}
            key={scraper as string} // TODO: fix
            onClick={handleTileClick(scraper)}
            isHighlighted={isHighlighted(scraper)}
            isDimmed={!isHighlighted(null)}
          />
        ))}
      </Grid>
    </Layout>
  )
}

export default Statistics
