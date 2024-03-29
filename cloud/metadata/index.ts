import searchMetadata from './searchMetadata'
import documentClient from '../documentClient'
import { logger } from '../powertools'

type Metadata = {
  query: string
  createdAt: string
  title?: string
  imdbId?: string
  tmdb?: any
}

const getMetadata = async (title: string): Promise<Metadata> => {
  // find the metadata in dynamoDB
  // TODO: should be a .get
  const data = await documentClient
    .query({
      TableName: process.env.DYNAMODB_MOVIE_METADATA,
      KeyConditionExpression: '#query = :query',
      ExpressionAttributeNames: {
        '#query': 'query',
      },
      ExpressionAttributeValues: {
        ':query': title,
      },
    })
    .promise()

  // if there is no metadata, search for it, create it in DynamoDB, and return it
  if (data.Items.length === 0) {
    logger.info(`❌ couldn't get metadata for ${title}, searching for it`)
    const metadata = await searchMetadata(title)
    const item = {
      query: title,
      createdAt: new Date().toISOString(),
      ...(metadata ?? {}),
    }

    await documentClient
      .put({
        TableName: process.env.DYNAMODB_MOVIE_METADATA,
        Item: item,
      })
      .promise()

    return item
  } else {
    logger.info(`✅ found the get metadata for ${title}`, {
      title,
      item: data.Items[0],
    })
    return data.Items[0]
  }
}

export default getMetadata
