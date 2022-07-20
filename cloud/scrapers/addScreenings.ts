#!/usr/bin/env ts-eager
import fs from 'fs'
import { spawnSync } from 'child_process'
import { DateTime } from 'luxon'
import * as R from 'ramda'

const currentFilename = '../screenings.json'
const currentContents = fs.readFileSync(currentFilename, 'utf-8')
const currentJSON = JSON.parse(currentContents)

const latestFilename = spawnSync('ls', ['-t', './output/*_all_filtered.json'], {
  shell: true,
})
  .stdout.toString()
  .split('\n')[0]
const latestContents = fs.readFileSync(latestFilename, 'utf-8')
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
