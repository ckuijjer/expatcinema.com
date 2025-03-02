import * as cdk from 'aws-cdk-lib'
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import 'source-map-support/register'

import { getConfig } from './config'

type Stage = 'dev' | 'prod' | 'cdk'

type BackendStackProps = cdk.StackProps & { stage: Stage }

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props)

    const stage = props!.stage

    const publicBucketName = `expatcinema-public-${stage}`
    const scrapersOutputBucketName = `expatcinema-scrapers-output-${stage}`
    const scrapersAnalyticsTableName = `expatcinema-scrapers-analytics-${stage}`
    const scrapersMovieMetadataTableName = `expatcinema-scrapers-movie-metadata-${stage}`

    const config = getConfig()

    const analyticsLambda = new lambdaNodejs.NodejsFunction(
      this,
      'analytics-lambda',
      {
        description: 'Analytics Lambda',
        entry: 'src/analytics.ts',
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
        logRetention: RetentionDays.TWO_MONTHS,
      },
    )

    const httpApi = new HttpApi(this, 'api', {
      description: 'API Gateway for expatcinema.com',
    })

    new cdk.CfnOutput(this, 'api-endpoint', {
      value: httpApi.apiEndpoint,
      description: 'The HTTP API endpoint for expatcinema.com',
    })

    httpApi.addRoutes({
      path: '/analytics',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('analytics-get', analyticsLambda),
    })
  }
}
