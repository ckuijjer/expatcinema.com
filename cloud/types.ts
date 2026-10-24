export type Screening = {
  title: string
  year?: number
  director?: string
  // the festival or series the screening is part of, e.g. 'Imagine Film Festival'
  event?: string
  // what is added to this screening, e.g. ['Q&A', 'supporting film: Like Friend, Like Deer']
  notes?: string[]
  url: string
  cinema: string
  date: Date
}
