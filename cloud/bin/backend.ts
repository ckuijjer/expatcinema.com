#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'

import { BackendStack } from '../lib/backend-stack'

const app = new cdk.App()
const stage = 'prod'

new BackendStack(app, `expatcinema-${stage}`, {
  description: 'expatcinema.com',
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
