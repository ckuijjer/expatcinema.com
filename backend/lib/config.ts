export type ConfigProps = {
  DYNAMODB_ANALYTICS: string
}

export const getConfig = (): ConfigProps => ({
  DYNAMODB_ANALYTICS: process.env.DYNAMODB_ANALYTICS || '',
})
