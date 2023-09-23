import * as React from 'react'
import fetch from 'cross-fetch'
import dynamic from 'next/dynamic'

import Layout from '../components/Layout'
import Seo from '../components/Seo'
import Header from '../components/Header'
import { PageTitle } from '../components/PageTitle'
import { palette } from '../utils/theme'

const LoadableStatistics = dynamic(() => import('../components/Statistics'), {
  ssr: false,
})

const StatisticsPage = ({ data }) => {
  return (
    <>
      <Seo title="Statistics" />
      <Layout backgroundColor={palette.purple600}>
        <Header showSearch={false} />
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
