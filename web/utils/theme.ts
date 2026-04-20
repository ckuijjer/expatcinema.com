import { Libre_Baskerville, Libre_Franklin } from 'next/font/google'

export const headerFont = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const bodyFont = Libre_Franklin({
  subsets: ['latin'],
})
