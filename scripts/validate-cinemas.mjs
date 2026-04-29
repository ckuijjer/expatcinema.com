import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const webDirectory = path.resolve(scriptDirectory, '..', 'web')
const cinemasPath = path.join(webDirectory, 'data', 'cinema.json')
const citiesPath = path.join(webDirectory, 'data', 'city.json')

const cinemas = JSON.parse(fs.readFileSync(cinemasPath, 'utf8'))
const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'))
const cityNameBySlug = new Map(cities.map((city) => [city.slug, city.name]))
const failures = []

const requireString = (cinema, path, value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    failures.push(`${cinema.name}: ${path} is required`)
  }
}

for (const cinema of cinemas) {
  requireString(cinema, 'name', cinema.name)
  requireString(cinema, 'slug', cinema.slug)
  requireString(cinema, 'city', cinema.city)
  requireString(cinema, 'url', cinema.url)

  const expectedLocality = cityNameBySlug.get(cinema.city)
  if (!expectedLocality) {
    failures.push(`${cinema.name}: city "${cinema.city}" is not in city.json`)
  }

  const address = cinema.address
  if (!address || typeof address !== 'object') {
    failures.push(`${cinema.name}: address is required`)
    continue
  }

  requireString(cinema, 'address.streetAddress', address.streetAddress)
  requireString(cinema, 'address.postalCode', address.postalCode)
  requireString(cinema, 'address.addressLocality', address.addressLocality)
  requireString(cinema, 'address.googleMapsUrl', address.googleMapsUrl)

  if (
    typeof address.postalCode === 'string' &&
    !/^\d{4} [A-Z]{2}$/.test(address.postalCode)
  ) {
    failures.push(
      `${cinema.name}: address.postalCode must match "1234 AB", got "${address.postalCode}"`,
    )
  }

  if (expectedLocality && address.addressLocality !== expectedLocality) {
    failures.push(
      `${cinema.name}: address.addressLocality must match city.json value "${expectedLocality}", got "${address.addressLocality}"`,
    )
  }

  let mapsUrl
  try {
    mapsUrl = new URL(address.googleMapsUrl)
  } catch {
    failures.push(
      `${cinema.name}: address.googleMapsUrl is not a valid URL: ${address.googleMapsUrl}`,
    )
    continue
  }

  if (mapsUrl.origin !== 'https://www.google.com') {
    failures.push(
      `${cinema.name}: address.googleMapsUrl must use https://www.google.com`,
    )
  }

  if (mapsUrl.pathname !== '/maps/search/') {
    failures.push(
      `${cinema.name}: address.googleMapsUrl must use /maps/search/`,
    )
  }

  if (mapsUrl.searchParams.get('api') !== '1') {
    failures.push(`${cinema.name}: address.googleMapsUrl must include api=1`)
  }

  const query = mapsUrl.searchParams.get('query') ?? ''
  for (const expectedPart of [
    cinema.name,
    address.streetAddress,
    address.postalCode,
    address.addressLocality,
    'Netherlands',
  ]) {
    if (typeof expectedPart === 'string' && !query.includes(expectedPart)) {
      failures.push(
        `${cinema.name}: address.googleMapsUrl query is missing "${expectedPart}"`,
      )
    }
  }
}

if (failures.length > 0) {
  console.error(
    `Cinema data validation failed with ${failures.length} issue(s):`,
  )
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Validated ${cinemas.length} cinemas.`)
