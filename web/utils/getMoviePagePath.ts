export const getMoviePagePath = (
  movieSlug: string,
  city?: string | null,
  cinema?: string | null,
) => {
  const segments = [`/movie/${movieSlug}`]

  if (city) {
    segments.push(`city/${city}`)
  }

  if (cinema) {
    segments.push(`cinema/${cinema}`)
  }

  return segments.join('/')
}
