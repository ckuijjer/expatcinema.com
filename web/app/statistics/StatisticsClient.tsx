'use client'

import dynamic from 'next/dynamic'

import type { AnalyticsPoint } from '../../components/Statistics'

const Statistics = dynamic(
  () => import('../../components/Statistics').then((m) => m.Statistics),
  { ssr: false },
)

export const StatisticsClient = ({ points }: { points: AnalyticsPoint[] }) => {
  return <Statistics points={points} />
}
