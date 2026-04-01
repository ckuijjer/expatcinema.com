import cinemas from '../data/cinema.json'

export const getCinema = (slug: string) => cinemas.find((c) => c.slug === slug)
