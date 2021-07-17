const AWS = require('aws-sdk')

const documentClient = new AWS.DynamoDB.DocumentClient({
  convertEmptyValues: true,
})

module.exports = documentClient
