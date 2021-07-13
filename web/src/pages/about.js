import * as React from 'react'
import About from '../components/About'
import Layout from '../components/Layout'
import Seo from '../components/Seo'

const AboutPage = () => (
  <Layout>
    <Seo title="About" />
    <About />
  </Layout>
)

export default AboutPage
