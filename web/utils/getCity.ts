import cities from '../data/city.json'

export const getCity = (slug: string) => cities.find((c) => c.slug === slug)
