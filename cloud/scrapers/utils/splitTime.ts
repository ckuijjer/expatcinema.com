// : or . as separator
export const splitTime = (time: string) =>
  time.split(/:|\./).map((x) => Number(x))
