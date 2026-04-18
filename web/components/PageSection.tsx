import React from 'react'

import { PageHeading } from './PageHeading'

export const PageSection = (
  props: React.HTMLAttributes<HTMLHeadingElement>,
) => <PageHeading as="h2" {...props} />
