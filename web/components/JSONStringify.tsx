import React from 'react'

export const JSONStringify = ({ children }: { children: React.ReactNode }) => (
  <pre>{JSON.stringify(children, null, 2)}</pre>
)
