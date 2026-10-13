import { css } from 'styled-system/css'

// The big title of a movie, or of a cinema
export const bigTitleStyle = css({
  marginTop: '0',
  marginBottom: '0',
  fontSize: '44px',
  lineHeight: '1.05',
  '@media (max-width: 640px)': {
    fontSize: '32px',
  },
})

// The title of a cinema on a movie page, between the movie title and the date headings
export const subTitleStyle = css({
  marginTop: '0',
  marginBottom: '0',
  fontSize: '28px',
  lineHeight: '1.15',
  '@media (max-width: 640px)': {
    fontSize: '24px',
  },
})
