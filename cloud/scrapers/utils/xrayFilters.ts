export const trim = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value

export const normalizeWhitespace = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ') : value
