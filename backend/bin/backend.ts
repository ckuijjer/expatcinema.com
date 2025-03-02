#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'

import { BackendStack } from '../lib/backend-stack'

const app = new cdk.App()
new BackendStack(app, 'expatcinema-cdk', {
  description: 'expatcinema.com',
  stage: 'prod',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
