import * as cdk from 'aws-cdk-lib'
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import 'source-map-support/register'

import { getConfig } from './config'

type Stage = 'dev' | 'prod'

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

    const DEFAULT_FUNCTION_ENVIRONMENT_PROPS = {
      NODE_OPTIONS: '--enable-source-maps --trace-warnings',
      POWERTOOLS_SERVICE_NAME: id,
    }

    const DEFAULT_FUNCTION_PROPS: lambdaNodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(1),
      architecture: lambda.Architecture.X86_64,
      memorySize: 1024,
      bundling: {
        keepNames: true,
        sourceMap: true,
        minify: true,
        metafile: true,
        // externalModules: ['emitter', '@sparticuz/chromium'],
        externalModules: [
          'emitter',
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/client-s3',
          '@aws-sdk/lib-dynamodb',
        ],
        nodeModules: ['@sparticuz/chromium'],
        // format: lambdaNodejs.OutputFormat.ESM,
        // Above unfortunately doesn't work yet, see error message below
        // "Error: Dynamic require of \"http\" is not supported",
        // "    at file:///var/task/index.mjs:1:436",
        // "    at PacProxyAgent (/node_modules/.pnpm/proxy-agent@6.5.0/node_modules/proxy-agent/src/index.ts:1:1)",
        // "    at file:///var/task/index.mjs:1:548",
        // "    at <anonymous> (/node_modules/.pnpm/@puppeteer+browsers@2.7.1/node_modules/@puppeteer/browsers/src/httpUtil.ts:12:26)",
        // "    at ModuleJob.run (node:internal/modules/esm/module_job:271:25)",
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

    // Notify Slack
    const notifySlackLambda = new lambdaNodejs.NodejsFunction(
      this,
      'notify-slack-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `${id}-notify-slack`,
        description: 'Notify Slack Lambda',
        entry: 'notifySlack.ts',
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,

          SLACK_WEBHOOK: config.SLACK_WEBHOOK,
        },
      },
    )

    // Scrapers
    const chromeAwsLambdaLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'scrapers-lambda-layer',
      'arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:50',
    )

    // TODO: Fix the issue with bundling (likely see scrapers.ts and scrapers/index.ts)
    const scrapersLambda = new lambdaNodejs.NodejsFunction(
      this,
      'scrapers-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `${id}-scrapers`,
        description: 'Scrapers Lambda',
        entry: 'scrapers.ts', // TODO: Fix the issue with bundling (likely see scrapers.ts and scrapers/index.ts)

        memorySize: 8192,
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
        // layers: [chromeAwsLambdaLayer],
      },
    )

    // Schedule for Scrapers Lambda
    new events.Rule(this, 'scrapers-schedule-rule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '3',
        day: '*',
        month: '*',
        year: '*',
      }),
      targets: [new targets.LambdaFunction(scrapersLambda)],
    })

    scrapersLambda.logGroup.addSubscriptionFilter('notify-slack-subscription', {
      destination: new cdk.aws_logs_destinations.LambdaDestination(
        notifySlackLambda,
      ),
      filterPattern: { logPatternString: '' }, // Match all logs
    })

    // Playground
    const playgroundLambda = new lambdaNodejs.NodejsFunction(
      this,
      'playground-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `${id}-playground`,
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
        // layers: [chromeAwsLambdaLayer],
      },
    )

    // Analytics
    const analyticsLambda = new lambdaNodejs.NodejsFunction(
      this,
      'analytics-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `${id}-analytics`,
        description: 'Analytics Lambda',
        entry: 'analytics.ts',
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
          DYNAMODB_ANALYTICS: scrapersAnalyticsTableName,
        },
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
        functionName: `${id}-fill-analytics`,
        description: 'Fill Analytics',
        entry: 'fillAnalytics.ts',
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,

          PRIVATE_BUCKET: scrapersOutputBucketName,
          DYNAMODB_ANALYTICS: scrapersAnalyticsTableName,
        },
      },
    )

    // Scrapers Output Bucket
    const scrapersOutputBucket = new s3.Bucket(this, 'scrapers-output-bucket', {
      bucketName: scrapersOutputBucketName,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })
    scrapersOutputBucket.grantRead(playgroundLambda)
    scrapersOutputBucket.grantRead(fillAnalyticsLambda)
    scrapersOutputBucket.grantReadWrite(scrapersLambda)

    // Public Bucket
    const publicBucket = new s3.Bucket(this, 'public-bucket', {
      bucketName: publicBucketName,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      cors: [
        {
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // Public Bucket Policy
    publicBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${publicBucket.bucketArn}/*`],
        principals: [new cdk.aws_iam.AnyPrincipal()],
        effect: cdk.aws_iam.Effect.ALLOW,
      }),
    )

    publicBucket.grantReadWrite(scrapersLambda)

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

    scrapersAnalyticsTable.grantReadData(analyticsLambda)
    scrapersAnalyticsTable.grantReadWriteData(scrapersLambda)
    scrapersAnalyticsTable.grantReadWriteData(fillAnalyticsLambda)
    scrapersAnalyticsTable.grantReadData(playgroundLambda)

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

    scrapersMovieMetadataTable.grantReadWriteData(scrapersLambda)
    scrapersMovieMetadataTable.grantReadData(playgroundLambda)

    scrapersLambda.role?.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          'arn:aws:bedrock:eu-west-1:434488156586:inference-profile/eu.amazon.nova-micro-v1:0',
        ],
      }),
    )
  }
}
