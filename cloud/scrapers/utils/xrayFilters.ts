export const trim = (value: unknown) =>
  typeof value === 'string' ? value.trim() : value
