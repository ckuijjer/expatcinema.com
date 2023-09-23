#!/usr/bin/env node
import fs from 'fs'
import { DateTime } from 'luxon'
import * as R from 'ramda'

const sort = R.sortWith([
  (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
  R.ascend(R.prop('cinema')),
  R.ascend(R.prop('title')),
  R.ascend(R.prop('url')),
])

const data = fs.readFileSync('/dev/stdin', 'utf-8')

const input = JSON.parse(data)
const output = sort(R.uniq(input))

console.log(JSON.stringify(output, null, 2))
