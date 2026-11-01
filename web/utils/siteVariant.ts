// The site is built twice: once as it is, and once with the new layout, which is
// served under /next (see next.config.js and the web workflow)
export const isNextVariant = process.env.NEXT_PUBLIC_SITE_VARIANT === 'next'
