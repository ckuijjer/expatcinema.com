import Document, { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

const GA_TRACKING_ID = 'G-W3YQQJKL1T'

const GoogleAnalytics = () => (
  <>
    <Script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
    />
    <Script id="google-analytics">
      {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', ${GA_TRACKING_ID});
  `}
    </Script>
  </>
)

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <GoogleAnalytics />
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
