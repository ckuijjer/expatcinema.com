import * as cdk from 'aws-cdk-lib'
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import 'source-map-support/register'

import { getConfig } from './config'

// TODO: use the line below when everything works,
// type Stage = 'dev' | 'prod'
type Stage = 'cdk'

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

    // Scrapers Output Bucket
    const scrapersOutputBucket = new s3.Bucket(this, 'scrapers-output-bucket', {
      bucketName: scrapersOutputBucketName,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // Public Bucket
    // const publicBucket = new s3.Bucket(this, 'public-bucket', {
    //   bucketName: publicBucketName,
    //   publicReadAccess: true,
    //   cors: [
    //     {
    //       allowedOrigins: ['*'],
    //       allowedHeaders: ['*'],
    //       allowedMethods: [s3.HttpMethods.GET],
    //       maxAge: 3000,
    //     },
    //   ],
    //   removalPolicy: cdk.RemovalPolicy.RETAIN,
    // })

    // // Public Bucket Policy
    // publicBucket.addToResourcePolicy(
    //   new cdk.aws_iam.PolicyStatement({
    //     actions: ['s3:GetObject'],
    //     resources: [`${publicBucket.bucketArn}/*`],
    //     principals: [new cdk.aws_iam.AnyPrincipal()],
    //     effect: cdk.aws_iam.Effect.ALLOW,
    //   }),
    // )

    // Scrapers Analytics DynamoDB Table
    const scrapersAnalyticsTable = new dynamodb.Table(
      this,
      'ScrapersAnalyticsDynamoDbTable',
      {
        tableName: scrapersAnalyticsTableName,
        partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    )

    // Scrapers Movie Metadata DynamoDB Table
    const scrapersMovieMetadataTable = new dynamodb.Table(
      this,
      'ScrapersMovieMetadataDynamoDbTable',
      {
        tableName: scrapersMovieMetadataTableName,
        partitionKey: { name: 'query', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
    )

    const DEFAULT_FUNCTION_ENVIRONMENT_PROPS = {
      NODE_OPTIONS: '--enable-source-maps --trace-warnings',
      POWERTOOLS_SERVICE_NAME: `${id}-${stage}`,
    }

    const DEFAULT_FUNCTION_PROPS: lambdaNodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(1),
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      bundling: {
        keepNames: true,
        sourceMap: true,
        minify: true,
        metafile: true,
      },
      environment: {
        ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
      },
      logRetention: RetentionDays.TWO_MONTHS,
    }

    // API Gateway
    const httpApi = new HttpApi(this, 'api', {
      description: 'API Gateway for expatcinema.com',
    })

    new cdk.CfnOutput(this, 'api-endpoint', {
      value: httpApi.apiEndpoint,
      description: 'The HTTP API endpoint for expatcinema.com',
    })

    // Scrapers
    const chromeAwsLambdaLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'scrapers-lambda-layer',
      'arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:45',
    )

    const scrapersLambda = new lambdaNodejs.NodejsFunction(
      this,
      'scrapers-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        description: 'Scrapers Lambda',
        entry: 'scrapers.ts',
        memorySize: 4096,
        timeout: cdk.Duration.minutes(9),
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,

          PRIVATE_BUCKET: scrapersOutputBucketName,
          PUBLIC_BUCKET: publicBucketName,
          DYNAMODB_ANALYTICS: scrapersAnalyticsTableName,
          DYNAMODB_MOVIE_METADATA: scrapersMovieMetadataTableName,

          TMDB_API_KEY: config.TMDB_API_KEY,
          OMDB_API_KEY: config.OMDB_API_KEY,
          GOOGLE_CUSTOM_SEARCH_ID: config.GOOGLE_CUSTOM_SEARCH_ID,
          GOOGLE_CUSTOM_SEARCH_API_KEY: config.GOOGLE_CUSTOM_SEARCH_API_KEY,
          SCRAPERS: config.SCRAPERS,
          SCRAPEOPS_API_KEY: config.SCRAPEOPS_API_KEY,
        },
        layers: [chromeAwsLambdaLayer],
      },
    )

    // Schedule for Scrapers Lambda
    // TODO: Turn on the schedule eventually
    // new events.Rule(this, 'scrapers-schedule-rule', {
    //   schedule: events.Schedule.cron({ minute: '0', hour: '3', day: '*', month: '*', year: '*' }),
    //   targets: [new targets.LambdaFunction(scrapersLambda)],
    // });

    // Playground
    const playgroundLambda = new lambdaNodejs.NodejsFunction(
      this,
      'playground-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        description: 'Playground Lambda',
        entry: 'playground.ts',
        timeout: cdk.Duration.minutes(5),
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,

          PRIVATE_BUCKET: scrapersOutputBucketName,
          PUBLIC_BUCKET: publicBucketName,
          DYNAMODB_ANALYTICS: scrapersAnalyticsTableName,
          DYNAMODB_MOVIE_METADATA: scrapersMovieMetadataTableName,

          TMDB_API_KEY: config.TMDB_API_KEY,
          OMDB_API_KEY: config.OMDB_API_KEY,
          GOOGLE_CUSTOM_SEARCH_ID: config.GOOGLE_CUSTOM_SEARCH_ID,
          GOOGLE_CUSTOM_SEARCH_API_KEY: config.GOOGLE_CUSTOM_SEARCH_API_KEY,
          SCRAPERS: config.SCRAPERS,
          SCRAPEOPS_API_KEY: config.SCRAPEOPS_API_KEY,
        },
        layers: [chromeAwsLambdaLayer],
      },
    )

    // Notify Slack
    const notifySlackLambda = new lambdaNodejs.NodejsFunction(
      this,
      'notify-slack-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        description: 'Notify Slack Lambda',
        entry: 'notifySlack.ts',
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,

          SLACK_WEBHOOK: config.SLACK_WEBHOOK,
        },
      },
    )

    // scrapersLambda.logGroup.addSubscriptionFilter('notify-slack-subscription', {
    //   destination: new cdk.aws_logs_destinations.LambdaDestination(
    //     notifySlackLambda,
    //   ),
    //   filterPattern: { logPatternString: '' }, // Match all logs
    // })

    // Analytics
    const analyticsLambda = new lambdaNodejs.NodejsFunction(
      this,
      'analytics-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        description: 'Analytics Lambda',
        entry: 'analytics.ts',
      },
    )

    httpApi.addRoutes({
      path: '/analytics',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('analytics-get', analyticsLambda),
    })

    // Fill Analytics TODO: Untested
    const fillAnalyticsLambda = new lambdaNodejs.NodejsFunction(
      this,
      'fill-analytics-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        description: 'Fill Analytics',
        entry: 'fillAnalytics.ts',
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,

          PRIVATE_BUCKET: scrapersOutputBucketName,
          DYNAMODB_ANALYTICS: scrapersAnalyticsTableName,
        },
      },
    )
  }
}
