#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import dotenv from 'dotenv'

import { BackendStack } from '../lib/backend-stack'

dotenv.config()

const app = new cdk.App()
const stage = process.env.STAGE || 'prod'

new BackendStack(app, `expatcinema-${stage}`, {
  description: 'expatcinema.com',
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
