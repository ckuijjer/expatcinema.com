import { css } from '@emotion/react'
import { line, plot } from '@observablehq/plot'
import React from 'react'

import { Layout } from './Layout'

type AnalyticsPoint = {
  scraper: string
  value: number
  createdAt: string
}

// Grid component that has cells with a width of 200px and using css grid layout
const Grid = ({ children }: { children: React.ReactNode }) => (
  <div
    css={css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      grid-gap: 12px;
      margin-bottom: 32px;
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
}: {
  title: string
  value: number
  onClick?: () => void
  isHighlighted?: boolean
}) => {
  const color = isHighlighted
    ? 'var(--secondary-color)'
    : 'var(--text-muted-color)'

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

export const Statistics = ({ points }: { points: AnalyticsPoint[] }) => {
  const [highlight, setHighlight] = React.useState<string | null>(null)

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
        .reduce(
          (acc: Partial<AnalyticsPoint>, x) => {
            if (x.createdAt > (acc.createdAt ?? '') || !acc.createdAt) return x
            return acc
          },
          {},
        )
      return { scraper, value: latest.value ?? 0 }
    })
    .sort((a, b) => b.value - a.value)

  const svg = plot({
    marks: [
      line(sortedPoints, {
        x: 'createdAt',
        y: 'value',
        z: 'scraper',
        curve: 'bump-x',
        stroke: (d) => d.scraper === highlight,
        strokeWidth: 2,
      }),
    ],
    y: {
      label: '',
    },
    x: {
      label: '',
      transform: (d: string) => new Date(d),
      tickFormat: (d: Date) => d.toLocaleDateString(),
    },
    color: {
      domain: highlight ? [true, false] : [false],
      range: highlight
        ? ['var(--secondary-color)', 'var(--primary-color)']
        : ['currentColor'],
    },
    grid: true,
    width: 960,
    style: {
      overflow: 'visible',
      color: 'var(--text-muted-color)',
      background: 'var(--background-color)',
      fontSize: '10px',
    },
  })

  const isHighlighted = (scraper: string) => scraper === highlight

  const handleTileClick = (scraper: string) => () => {
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
            key={scraper}
            onClick={handleTileClick(scraper)}
            isHighlighted={isHighlighted(scraper)}
          />
        ))}
      </Grid>
    </Layout>
  )
}
