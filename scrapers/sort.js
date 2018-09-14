#!/usr/bin/env node

// Reads JSON from stdin and writes equivalent
// nicely-formatted JSON to stdout.

const { DateTime } = require('luxon')
const R = require('ramda')

const sort = R.sortWith([
  (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
  R.ascend(R.prop('title')),
  R.ascend(R.prop('cinema')),
])

var stdin = process.stdin,
  stdout = process.stdout,
  inputChunks = []

stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', function(chunk) {
  inputChunks.push(chunk)
})

stdin.on('end', function() {
  const input = JSON.parse(inputChunks.join())

  const output = sort(input)

  console.log(JSON.stringify(output, null, 2))
})
