import * as React from 'react'
import { css } from '@emotion/react'
import Layout from '../components/Layout'
import Header from '../components/Header'

const EmotionTest = () => (
  // <div style={{ margin: 100 }}>
  <Layout>
    <Header />
    <div
      css={css`
        color: red;
        font-size: 48px;
      `}
    >
      EmotionTest
    </div>
  </Layout>
  // </div>
)

export default EmotionTest
