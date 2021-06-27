import * as React from 'react'
import App from '../components/App'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const IndexPage = () => (
  <Layout>
    <Seo title="Home" />
    <App />
  </Layout>
)

export default IndexPage
