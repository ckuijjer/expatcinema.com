#!/usr/bin/env node
const fs = require('fs')
const { spawnSync } = require('child_process')
const { DateTime } = require('luxon')
const R = require('ramda')

const currentFilename = '../spa/src/data/screenings.json'
const currentContents = fs.readFileSync(currentFilename)
const currentJSON = JSON.parse(currentContents)

const latestFilename = spawnSync('ls', ['-t', './output/*_all.json'], {
  shell: true,
})
  .stdout.toString()
  .split('\n')[0]
const latestContents = fs.readFileSync(latestFilename)
const latestJSON = JSON.parse(latestContents)

const combined = [...currentJSON, ...latestJSON]

const sort = R.sortWith([
  (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
  R.ascend(R.prop('cinema')),
  R.ascend(R.prop('title')),
  R.ascend(R.prop('url')),
])

const output = sort(R.uniq(combined))

fs.writeFileSync(currentFilename, JSON.stringify(output, null, 2))
