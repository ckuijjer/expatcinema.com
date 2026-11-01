/** @type {import('next').NextConfig} */
// NEXT_PUBLIC_SITE_VARIANT=next builds the new layout under /next, in its own
// directory (out-next) so that it does not overwrite the build of the site
const nextVariant = process.env.NEXT_PUBLIC_SITE_VARIANT === 'next'

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  ...(nextVariant && { basePath: '/next', distDir: 'out-next' }),
}

module.exports = nextConfig
