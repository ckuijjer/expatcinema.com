import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const ddbClient = new DynamoDBClient({})
const translateConfig = {
  marshallOptions: {
    // Setting convertEmptyValues to true to mimic v2 behavior
    convertEmptyValues: true, // Converts empty strings and binary buffers to NULL
    removeUndefinedValues: true, // Removes attributes with undefined values
    convertClassInstanceToMap: false, // Handle class instances as maps
  },
  unmarshallOptions: {
    wrapNumbers: false, // Convert number values to BigNumber or NumberValue
  },
}

const documentClient = DynamoDBDocumentClient.from(ddbClient, translateConfig)

export default documentClient
