import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda'

import { DateTime, Info, Settings } from 'luxon'
import { inspect } from 'util'
// import ketelhuis from './scrapers/ketelhuis'
import got from 'got'
import { publicIp, publicIpv4, publicIpv6 } from 'public-ip'
// import chromium from 'chrome-aws-lambda'
// const chromium = require('chrome-aws-lambda')
import chromium from '@sparticuz/chrome-aws-lambda'

import puppeteer from 'puppeteer'

// const documentClient = require('./documentClient')

Settings.defaultZone = 'Europe/Amsterdam'

const timezonePlayground = async ({ event, context } = {}) => {
  const timestamp = '2019-01-09 11:23'
  const format = 'yyyy-MM-dd HH:mm'

  const amsterdamFromFormatWithZone = DateTime.fromFormat(timestamp, format, {
    zone: 'Europe/Amsterdam',
  })
    .toUTC()
    .toISO()

  const utcTime = DateTime.fromFormat(timestamp, format).toUTC().toISO()

  const utcTimeWithZone = DateTime.fromFormat(timestamp, format, {
    zone: 'UTC',
  })
    .toUTC()
    .toISO()

  const result = {
    // features,
    amsterdamFromFormatWithZone,
    utcTime,
    utcTimeWithZone,
  }

  console.log(result)
  return result
}

const getUsingChromium = async (url: string) => {
  let result = null
  let browser = null

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    let page = await browser.newPage()

    await page.goto(url)

    return await page.content()
  } catch (error) {
    throw error
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
}

const playground = async ({ event, context } = {}) => {
  // const results = await ketelhuis()

  // try {
  //   const response = await got('https://www.lab111.nl/programma', {
  //     headers: {
  //       'User-Agent':
  //         'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  //     },
  //     hooks: {
  //       beforeRequest: [
  //         function (options) {
  //           // console.log(options)
  //         },
  //       ],
  //     },
  //   })
  //   console.log(response.statusCode)
  // } catch (error) {
  //   console.error(error)
  // }

  try {
    // const content = await getUsingChromium('https://www.lab111.nl/programma')
    const content = await getUsingChromium(
      'http://webcache.googleusercontent.com/search?q=cache:https://www.lab111.nl/programma/',
    )
    console.log(content)
  } catch (error) {
    console.error(error)
  }

  console.log('ip addressess')
  // console.log('publicIp', await publicIp())
  console.log('publicIpv4', await publicIpv4())
  // console.log('publicIpv6', await publicIpv6())
  console.log('end ip addressess')
}

if (require.main === module) {
  // console.log(playground({}))
  playground()
}

export default playground
