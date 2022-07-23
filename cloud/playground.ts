import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda'

import { DateTime, Info, Settings } from 'luxon'
import { inspect } from 'util'
// import ketelhuis from './scrapers/ketelhuis'
import got from 'got'

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

const playground = async ({ event, context } = {}) => {
  // const results = await ketelhuis()

  const response = await got('https://www.lab111.nl', {
    hooks: {
      beforeRequest: [
        function (options) {
          console.log(options)
        },
      ],
    },
  })
  console.log(response.statusCode)
}

if (require.main === module) {
  // console.log(playground({}))
  playground()
}

export default playground
