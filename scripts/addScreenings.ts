#!/usr/bin/env tsx
import { spawnSync } from 'child_process'
import fs from 'fs'
import { DateTime } from 'luxon'

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

const sort = (arr: any[]) =>
  [...arr].sort((a, b) => {
    const dateDiff =
      DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis()
    if (dateDiff !== 0) return dateDiff
    if (a.cinema < b.cinema) return -1
    if (a.cinema > b.cinema) return 1
    if (a.title < b.title) return -1
    if (a.title > b.title) return 1
    if (a.url < b.url) return -1
    if (a.url > b.url) return 1
    return 0
  })

const uniq = (arr: any[]) => {
  const seen = new Set<string>()
  return arr.filter((item) => {
    const key = JSON.stringify(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const output = sort(uniq(combined))

fs.writeFileSync(currentFilename, JSON.stringify(output, null, 2))
