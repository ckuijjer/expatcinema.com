import * as cdk from 'aws-cdk-lib'
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import 'source-map-support/register'

import { getConfig } from './config'

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const config = getConfig()

    const analyticsLambda = new lambdaNodejs.NodejsFunction(
      this,
      'analyticsLambda',
      {
        description: 'Analytics Lambda',
        entry: '../cloud/analytics.ts',
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.minutes(1),
        architecture: lambda.Architecture.ARM_64,
        bundling: {
          keepNames: true,
          sourceMap: true,
          minify: true,
          metafile: true,
        },
        environment: {
          DYNAMODB_ANALYTICS: config.DYNAMODB_ANALYTICS,
        },
      },
    )

    const httpApi = new HttpApi(this, 'api', {
      description: 'API Gateway for expatcinema.com',
    })

    httpApi.addRoutes({
      path: '/analytics',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        `api/hello-world-get`,
        analyticsLambda,
      ),
    })

    new cdk.CfnOutput(this, 'apiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'The HTTP API endpoint for expatcinema.com',
    })
  }
}
