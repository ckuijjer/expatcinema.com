import * as React from 'react'
import App from '../components/App'
import Layout from '../components/Layout'
import SEO from '../components/Seo'

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <App />
  </Layout>
)

export default IndexPage
