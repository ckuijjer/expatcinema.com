/**
 * Scraper State Machine Construct
 *
 * Defines the Step Functions state machine for orchestrating the scraper workflow.
 * The workflow consists of:
 * 1. Parallel scraping (HTTP and Puppeteer scrapers)
 * 2. Aggregation
 * 3. Metadata enrichment
 * 4. Storage
 */

import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import { Construct } from 'constructs'

// Scraper names by type
const HTTP_SCRAPERS = [
  'bioscopenleiden',
  'cinecenter',
  'cinecitta',
  'cinerama',
  'concordia',
  'defilmhallen',
  'deuitkijk',
  'dokhuis',
  'eyefilm',
  'filmhuisdenhaag',
  'filmhuislumen',
  'filmkoepel',
  'forumgroningen',
  'hartlooper',
  'hetdocumentairepaviljoen',
  'kinorotterdam',
  'kriterion',
  'lab1',
  'lantarenvenster',
  'lux',
  'melkweg',
  'natlab',
  'rialto',
  'slachtstraat',
  'springhaver',
  'studiok',
  'themovies',
]

const PUPPETEER_SCRAPERS = [
  'florafilmtheater',
  'focusarnhem',
  'ketelhuis',
  'lab111',
  'lumiere',
  'schuur',
]

export interface ScraperStateMachineProps {
  stage: string
  partialBucket: s3.IBucket
  publicBucket: s3.IBucket
  privateBucket: s3.IBucket
  analyticsTable: dynamodb.ITable
  metadataTable: dynamodb.ITable
  config: {
    TMDB_API_KEY: string
    OMDB_API_KEY: string
    GOOGLE_CUSTOM_SEARCH_ID: string
    GOOGLE_CUSTOM_SEARCH_API_KEY: string
    SCRAPEOPS_API_KEY: string
  }
}

export class ScraperStateMachine extends Construct {
  public readonly stateMachine: sfn.StateMachine
  public readonly httpScraperLambda: lambdaNodejs.NodejsFunction
  public readonly puppeteerScraperLambda: lambdaNodejs.NodejsFunction

  constructor(scope: Construct, id: string, props: ScraperStateMachineProps) {
    super(scope, id)

    const {
      stage,
      partialBucket,
      publicBucket,
      privateBucket,
      analyticsTable,
      metadataTable,
      config,
    } = props

    const DEFAULT_FUNCTION_ENVIRONMENT_PROPS = {
      NODE_OPTIONS: '--enable-source-maps --trace-warnings',
      POWERTOOLS_SERVICE_NAME: `expatcinema-${stage}`,
    }

    const DEFAULT_FUNCTION_PROPS: lambdaNodejs.NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.X86_64,
      bundling: {
        keepNames: true,
        sourceMap: true,
        minify: true,
        metafile: true,
        externalModules: [
          'emitter',
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/client-s3',
          '@aws-sdk/lib-dynamodb',
        ],
      },
      logRetention: RetentionDays.TWO_MONTHS,
    }

    // HTTP Scraper Lambda (lightweight, 256MB)
    this.httpScraperLambda = new lambdaNodejs.NodejsFunction(
      this,
      'http-scraper-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `expatcinema-${stage}-http-scraper`,
        description: 'HTTP Scraper Lambda for Step Functions',
        entry: 'lambdas/http-scraper.ts',
        memorySize: 256,
        timeout: cdk.Duration.minutes(2),
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
          PARTIAL_BUCKET: partialBucket.bucketName,
        },
      },
    )

    // Puppeteer Scraper Lambda (needs Chrome, 4GB)
    this.puppeteerScraperLambda = new lambdaNodejs.NodejsFunction(
      this,
      'puppeteer-scraper-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `expatcinema-${stage}-puppeteer-scraper`,
        description: 'Puppeteer Scraper Lambda for Step Functions',
        entry: 'lambdas/puppeteer-scraper.ts',
        memorySize: 4096,
        timeout: cdk.Duration.minutes(5),
        bundling: {
          ...DEFAULT_FUNCTION_PROPS.bundling,
          nodeModules: ['@sparticuz/chromium'],
        },
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
          PARTIAL_BUCKET: partialBucket.bucketName,
        },
      },
    )

    // Aggregator Lambda
    const aggregatorLambda = new lambdaNodejs.NodejsFunction(
      this,
      'aggregator-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `expatcinema-${stage}-aggregator`,
        description: 'Aggregator Lambda for Step Functions',
        entry: 'lambdas/aggregator.ts',
        memorySize: 512,
        timeout: cdk.Duration.minutes(3),
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
          PARTIAL_BUCKET: partialBucket.bucketName,
        },
      },
    )

    // Metadata Enricher Lambda
    const metadataEnricherLambda = new lambdaNodejs.NodejsFunction(
      this,
      'metadata-enricher-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `expatcinema-${stage}-metadata-enricher`,
        description: 'Metadata Enricher Lambda for Step Functions',
        entry: 'lambdas/metadata-enricher.ts',
        memorySize: 512,
        timeout: cdk.Duration.minutes(5),
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
          PARTIAL_BUCKET: partialBucket.bucketName,
          DYNAMODB_MOVIE_METADATA: metadataTable.tableName,
          TMDB_API_KEY: config.TMDB_API_KEY,
          OMDB_API_KEY: config.OMDB_API_KEY,
          GOOGLE_CUSTOM_SEARCH_ID: config.GOOGLE_CUSTOM_SEARCH_ID,
          GOOGLE_CUSTOM_SEARCH_API_KEY: config.GOOGLE_CUSTOM_SEARCH_API_KEY,
        },
      },
    )

    // Storage Lambda
    const storageLambda = new lambdaNodejs.NodejsFunction(
      this,
      'storage-lambda',
      {
        ...DEFAULT_FUNCTION_PROPS,
        functionName: `expatcinema-${stage}-storage`,
        description: 'Storage Lambda for Step Functions',
        entry: 'lambdas/storage.ts',
        memorySize: 256,
        timeout: cdk.Duration.minutes(2),
        environment: {
          ...DEFAULT_FUNCTION_ENVIRONMENT_PROPS,
          PARTIAL_BUCKET: partialBucket.bucketName,
          PUBLIC_BUCKET: publicBucket.bucketName,
          PRIVATE_BUCKET: privateBucket.bucketName,
          DYNAMODB_ANALYTICS: analyticsTable.tableName,
        },
      },
    )

    // Grant permissions
    partialBucket.grantReadWrite(this.httpScraperLambda)
    partialBucket.grantReadWrite(this.puppeteerScraperLambda)
    partialBucket.grantReadWrite(aggregatorLambda)
    partialBucket.grantReadWrite(metadataEnricherLambda)
    partialBucket.grantReadWrite(storageLambda)

    publicBucket.grantReadWrite(storageLambda)
    privateBucket.grantReadWrite(storageLambda)

    metadataTable.grantReadWriteData(metadataEnricherLambda)
    analyticsTable.grantReadWriteData(storageLambda)

    // Define Step Functions tasks

    // Generate Run ID task (Pass state)
    const generateRunId = new sfn.Pass(this, 'GenerateRunId', {
      parameters: {
        'runId.$': 'States.Format(\'{}\', $$.Execution.StartTime)',
        httpScrapers: HTTP_SCRAPERS,
        puppeteerScrapers: PUPPETEER_SCRAPERS,
      },
    })

    // HTTP Scrapers Map state
    const httpScraperTask = new tasks.LambdaInvoke(this, 'InvokeHttpScraper', {
      lambdaFunction: this.httpScraperLambda,
      payload: sfn.TaskInput.fromObject({
        'scraperName.$': '$$.Map.Item.Value',
        'runId.$': '$.runId',
      }),
      resultSelector: {
        'scraperName.$': '$.Payload.scraperName',
        'count.$': '$.Payload.count',
        'success.$': '$.Payload.success',
        'error.$': '$.Payload.error',
      },
    })

    // Add retry logic
    httpScraperTask.addRetry({
      errors: ['States.TaskFailed', 'States.Timeout'],
      maxAttempts: 2,
      backoffRate: 2,
      interval: cdk.Duration.seconds(5),
    })

    // Add catch for individual failures (continue on error)
    httpScraperTask.addCatch(
      new sfn.Pass(this, 'HttpScraperError', {
        parameters: {
          'scraperName.$': '$$.Map.Item.Value',
          count: 0,
          success: false,
          'error.$': '$.Error',
        },
      }),
      { resultPath: '$.errorInfo' },
    )

    const httpScrapersMap = new sfn.Map(this, 'HttpScrapersMap', {
      itemsPath: '$.httpScrapers',
      maxConcurrency: 10,
      resultPath: '$.httpResults',
      parameters: {
        'runId.$': '$.runId',
        'scraperName.$': '$$.Map.Item.Value',
      },
    })
    httpScrapersMap.itemProcessor(httpScraperTask)

    // Puppeteer Scrapers Map state
    const puppeteerScraperTask = new tasks.LambdaInvoke(
      this,
      'InvokePuppeteerScraper',
      {
        lambdaFunction: this.puppeteerScraperLambda,
        payload: sfn.TaskInput.fromObject({
          'scraperName.$': '$$.Map.Item.Value',
          'runId.$': '$.runId',
        }),
        resultSelector: {
          'scraperName.$': '$.Payload.scraperName',
          'count.$': '$.Payload.count',
          'success.$': '$.Payload.success',
          'error.$': '$.Payload.error',
        },
      },
    )

    puppeteerScraperTask.addRetry({
      errors: ['States.TaskFailed', 'States.Timeout'],
      maxAttempts: 2,
      backoffRate: 2,
      interval: cdk.Duration.seconds(10),
    })

    puppeteerScraperTask.addCatch(
      new sfn.Pass(this, 'PuppeteerScraperError', {
        parameters: {
          'scraperName.$': '$$.Map.Item.Value',
          count: 0,
          success: false,
          'error.$': '$.Error',
        },
      }),
      { resultPath: '$.errorInfo' },
    )

    const puppeteerScrapersMap = new sfn.Map(this, 'PuppeteerScrapersMap', {
      itemsPath: '$.puppeteerScrapers',
      maxConcurrency: 2, // Limit Chrome instances
      resultPath: '$.puppeteerResults',
      parameters: {
        'runId.$': '$.runId',
        'scraperName.$': '$$.Map.Item.Value',
      },
    })
    puppeteerScrapersMap.itemProcessor(puppeteerScraperTask)

    // Parallel scraping (both HTTP and Puppeteer branches)
    const parallelScraping = new sfn.Parallel(this, 'ParallelScraping', {
      resultPath: '$.scrapingResults',
    })
    parallelScraping.branch(httpScrapersMap)
    parallelScraping.branch(puppeteerScrapersMap)

    // Prepare for aggregation (merge results from parallel branches)
    const prepareForAggregation = new sfn.Pass(this, 'PrepareForAggregation', {
      parameters: {
        'runId.$': '$.runId',
        'httpResults.$': '$.scrapingResults[0]',
        'puppeteerResults.$': '$.scrapingResults[1]',
      },
    })

    // Aggregator task
    const aggregatorTask = new tasks.LambdaInvoke(this, 'Aggregate', {
      lambdaFunction: aggregatorLambda,
      payload: sfn.TaskInput.fromObject({
        'runId.$': '$.runId',
        'httpResults.$': '$.httpResults',
        'puppeteerResults.$': '$.puppeteerResults',
      }),
      resultPath: '$.aggregationResult',
      resultSelector: {
        'runId.$': '$.Payload.runId',
        'totalScreenings.$': '$.Payload.totalScreenings',
        'uniqueTitles.$': '$.Payload.uniqueTitles',
        'scraperCounts.$': '$.Payload.scraperCounts',
        'failedScrapers.$': '$.Payload.failedScrapers',
      },
    })

    aggregatorTask.addRetry({
      errors: ['States.TaskFailed'],
      maxAttempts: 2,
      backoffRate: 2,
    })

    // Metadata enricher task
    const metadataEnricherTask = new tasks.LambdaInvoke(
      this,
      'EnrichMetadata',
      {
        lambdaFunction: metadataEnricherLambda,
        payload: sfn.TaskInput.fromObject({
          'runId.$': '$.aggregationResult.runId',
          'uniqueTitles.$': '$.aggregationResult.uniqueTitles',
        }),
        resultPath: '$.metadataResult',
        resultSelector: {
          'runId.$': '$.Payload.runId',
          'enrichedCount.$': '$.Payload.enrichedCount',
          'moviesWithMetadata.$': '$.Payload.moviesWithMetadata',
        },
      },
    )

    metadataEnricherTask.addRetry({
      errors: ['States.TaskFailed'],
      maxAttempts: 2,
      backoffRate: 2,
    })

    // Storage task
    const storageTask = new tasks.LambdaInvoke(this, 'Store', {
      lambdaFunction: storageLambda,
      payload: sfn.TaskInput.fromObject({
        'runId.$': '$.metadataResult.runId',
      }),
      resultPath: '$.storageResult',
    })

    storageTask.addRetry({
      errors: ['States.TaskFailed'],
      maxAttempts: 2,
      backoffRate: 2,
    })

    // Success state
    const success = new sfn.Succeed(this, 'Success', {
      comment: 'Scraper workflow completed successfully',
    })

    // Define the workflow
    const definition = generateRunId
      .next(parallelScraping)
      .next(prepareForAggregation)
      .next(aggregatorTask)
      .next(metadataEnricherTask)
      .next(storageTask)
      .next(success)

    // Create the state machine
    this.stateMachine = new sfn.StateMachine(this, 'ScraperStateMachine', {
      stateMachineName: `expatcinema-${stage}-scraper-workflow`,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(20),
      tracingEnabled: true,
    })
  }
}
