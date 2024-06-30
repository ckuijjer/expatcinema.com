import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

import documentClient from '../documentClient'
import { logger } from '../powertools'
import searchMetadata from './searchMetadata'

type Metadata = {
  query: string
  createdAt: string
  title?: string
  imdbId?: string
  tmdb?: {
    id: string
    adult: boolean
    backdropPath: string
    genreIds: number[]
    mediaType: string
    originalLanguage: string
    originalTitle: string
    overview: string
    popularity: number
    posterPath: string
    releaseDate: string
    title: string
    video: boolean
    voteAverage: number
    voteCount: number
  }
}

const getMetadata = async (title: string): Promise<Metadata | undefined> => {
  // find the metadata in dynamoDB
  // TODO: should be a .get

  const queryCommand = new QueryCommand({
    TableName: process.env.DYNAMODB_MOVIE_METADATA,
    KeyConditionExpression: '#query = :query',
    ExpressionAttributeNames: {
      '#query': 'query',
    },
    ExpressionAttributeValues: {
      ':query': title,
    },
  })

  const data = await documentClient.send(queryCommand)

  // if there is no metadata, search for it, create it in DynamoDB, and return it
  if (data.Items?.length === 0) {
    logger.info(`❌ couldn't get metadata for ${title}, searching for it`)
    const metadata = await searchMetadata(title)
    const item = {
      query: title,
      createdAt: new Date().toISOString(),
      ...(metadata ?? {}),
    }

    const putCommand = new PutCommand({
      TableName: process.env.DYNAMODB_MOVIE_METADATA,
      Item: item,
    })

    await documentClient.send(putCommand)

    return item
  } else {
    logger.info(`✅ found the get metadata for ${title}`, {
      title,
      item: data.Items?.[0],
    })

    return data.Items?.[0]
  }
}

export default getMetadata
