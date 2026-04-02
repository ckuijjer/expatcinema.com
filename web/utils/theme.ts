import { Libre_Baskerville, Libre_Franklin } from 'next/font/google'

export const headerFont = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const bodyFont = Libre_Franklin({
  subsets: ['latin'],
})

export const palette = {
  purple100: '#fff5f0' as const,
  purple200: '#ffe5e0' as const,
  purple300: '#ffafb0' as const,
  purple400: '#8c3547' as const,
  purple500: '#411d33' as const,
  purple600: '#310d23' as const,
}
