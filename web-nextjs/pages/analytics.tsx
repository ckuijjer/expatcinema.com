import * as React from 'react'
import fetch from 'cross-fetch'
import dynamic from 'next/dynamic'

import Layout from '../components/Layout'
import Seo from '../components/Seo'
import Header from '../components/Header'

const LoadableAnalytics = dynamic(() => import('../components/Analytics'), {
  ssr: false,
})

const AnalyticsPage = ({ data }) => {
  return (
    <Layout>
      {/* <Seo title="Analytics" /> */}
      <Header />
      <React.Suspense fallback={<div>Loading</div>}>
        <LoadableAnalytics points={data} />
      </React.Suspense>
    </Layout>
  )
}

export const getStaticProps = async () => {
  const url = `https://${process.env.APIGW_ID}.execute-api.eu-west-1.amazonaws.com/analytics`

  const response = await fetch(url)
  const data = await response.json()

  // TODO: sort?

  return {
    props: {
      data,
    },
  }
}

export default AnalyticsPage
