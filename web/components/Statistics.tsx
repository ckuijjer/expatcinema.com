import { line, plot } from '@observablehq/plot'
import React from 'react'

import { css, cva } from 'styled-system/css'

import { Layout } from './Layout'

type AnalyticsPoint = {
  scraper: string
  value: number
  createdAt: string
}

const gridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gridGap: '12px',
  marginBottom: '32px',
})

const tileVariants = cva({
  base: {
    padding: '16px',
    borderStyle: 'solid',
    borderRadius: '4px',
    borderWidth: '1px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  variants: {
    highlighted: {
      true: {
        borderColor: 'var(--secondary-color)',
        color: 'var(--secondary-color)',
      },
      false: {
        borderColor: 'var(--text-muted-color)',
        color: 'var(--text-muted-color)',
      },
    },
  },
  defaultVariants: {
    highlighted: false,
  },
})

const tileValueStyle = css({
  fontSize: '48px',
  marginBottom: '8px',
  fontWeight: 'bold',
})

const tileLabelStyle = css({
  fontSize: '18px',
})

const svgContainerStyle = css({
  marginTop: '32px',
  marginBottom: '32px',
})

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
  return (
    <div
      className={tileVariants({ highlighted: isHighlighted })}
      onClick={onClick}
    >
      <div className={tileValueStyle}>{value}</div>
      <div className={tileLabelStyle}>{title}</div>
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

  const latestValuePerScraper = scrapers
    .map((scraper) => {
      const latest = points
        .filter((x) => x.scraper === scraper)
        .reduce((acc: Partial<AnalyticsPoint>, x) => {
          if (x.createdAt > (acc.createdAt ?? '') || !acc.createdAt) return x
          return acc
        }, {})
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
        dangerouslySetInnerHTML={{ __html: svg.outerHTML }}
        className={svgContainerStyle}
      />
      <div className={gridStyle}>
        {latestValuePerScraper.map(({ scraper, value }) => (
          <Tile
            value={value}
            title={scraper}
            key={scraper}
            onClick={handleTileClick(scraper)}
            isHighlighted={isHighlighted(scraper)}
          />
        ))}
      </div>
    </Layout>
  )
}
