import * as dotenv from 'dotenv'

import path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env') })

export type ConfigProps = {
  DYNAMODB_ANALYTICS: string
}

export const getConfig = (): ConfigProps => ({
  DYNAMODB_ANALYTICS: process.env.DYNAMODB_ANALYTICS || '',
})
