import dynamic from 'next/dynamic'
import * as React from 'react'

import { Layout } from '../components/Layout'
import { NavigationBar } from '../components/NavigationBar'
import { PageTitle } from '../components/PageTitle'
import { SEO } from '../components/Seo'
import { palette } from '../utils/theme'

const LoadableStatistics = dynamic(
  () => import('../components/Statistics').then((m) => m.Statistics),
  {
    ssr: false,
  },
)

const StatisticsPage = ({ data }) => {
  return (
    <>
      <SEO title="Statistics" />
      <Layout backgroundColor={palette.purple600}>
        <NavigationBar showSearch={false} />
      </Layout>
      <Layout>
        <PageTitle>Statistics</PageTitle>
      </Layout>

      <React.Suspense fallback={<div>Loading</div>}>
        <LoadableStatistics points={data} />
      </React.Suspense>
    </>
  )
}

export const getStaticProps = async () => {
  const url = `https://${process.env.APIGW_ID}.execute-api.eu-west-1.amazonaws.com/analytics`

  const response = await fetch(url)
  const data = await response.json()

  return {
    props: {
      data,
    },
  }
}

export default StatisticsPage
