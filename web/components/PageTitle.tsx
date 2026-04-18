import React from 'react'

import { PageHeading } from './PageHeading'

export const PageTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <PageHeading as="h1" {...props} />
)
