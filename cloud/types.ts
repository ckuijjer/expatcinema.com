export type Screening = {
  title: string
  year?: number
  director?: string
  // the festival or series the screening is part of, e.g. 'Imagine Film Festival'
  event?: string
  url: string
  cinema: string
  date: Date
}
