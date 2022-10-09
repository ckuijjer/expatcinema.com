import fetch from 'cross-fetch'
import cinemas from '../data/cinema.json'
import cities from '../data/city.json'

type ScreeningData = {
  cinema: string
  date: string
  title: string
  url: string
}

type City = {
  name: string
}

type Cinema = {
  name: string
  url: string
  city: City
}

type Screening = {
  cinema: Cinema
  date: Date
  title: string
  url: string
}

export const getScreenings = async () => {
  const url = `https://s3-eu-west-1.amazonaws.com/${process.env.PUBLIC_BUCKET}/screenings.json`

  const response = await fetch(url)
  const data = await response.json()

  const screenings: Screening[] = data.map((screening: ScreeningData) => {
    const cinemaData = cinemas.find(
      (cinema) => cinema.name === screening.cinema,
    )

    const cinema: Cinema = {
      ...cinemaData,
      city: cities.find((city) => city.name === cinemaData.city),
    }

    return {
      ...screening,
      cinema,
    }
  })

  return screenings
}
