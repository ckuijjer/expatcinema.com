import { cleanDirector } from './cleanDirector'

// The fk-feed has `director_name: { label: 'Regie', value: '...' }`, or an
// empty string when there is no director
export const parseFkFeedDirector = (
  director?: { value?: string } | '' | null,
) => (director ? cleanDirector(director.value) : undefined)
