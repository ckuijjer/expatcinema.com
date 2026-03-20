#!/usr/bin/env tsx
import fs from 'fs'
import { DateTime } from 'luxon'

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

const data = fs.readFileSync('/dev/stdin', 'utf-8')

const input = JSON.parse(data)
const output = sort(uniq(input))

console.log(JSON.stringify(output, null, 2))
