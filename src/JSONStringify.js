import React from 'react'

const JSONStringify = ({ children }) => (
  <pre>{JSON.stringify(children, null, 2)}</pre>
)

export default JSONStringify
