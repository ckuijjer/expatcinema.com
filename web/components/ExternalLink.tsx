import { css } from 'styled-system/css'

import { ExternalLinkIcon } from './ExternalLinkIcon'

const externalLinkStyle = css({
  color: 'var(--secondary-color)',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  '&:hover': {
    opacity: '0.75',
  },
})

export const ExternalLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => (
  <a href={href} target="_blank" rel="noreferrer" className={externalLinkStyle}>
    {children}
    <ExternalLinkIcon />
  </a>
)
