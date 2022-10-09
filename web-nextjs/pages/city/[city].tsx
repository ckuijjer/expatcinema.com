import * as React from 'react'
import { useRouter } from 'next/router'

import App from '../../components/App'
import Layout from '../../components/Layout'
// import Seo from '../../components/Seo'
import { getScreenings } from '../../components/getScreenings'

import cities from '../../data/city.json'

export const getStaticPaths = () => {
  const paths = cities.map((city) => `/city/${city.name.toLowerCase()}`)

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async ({ params }) => {
  const { city } = params
  const screenings = (await getScreenings()).filter(
    (screening) => screening.cinema.city.name.toLowerCase() === city,
  )

  return {
    props: {
      data: screenings,
    },
  }
}

const CityPage = ({ data }) => {
  return (
    <Layout>
      {/* <Seo title="Home" /> */}
      <App screenings={data} />
    </Layout>
  )
}

export default CityPage
