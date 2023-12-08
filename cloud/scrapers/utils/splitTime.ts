// : or . as separator
const splitTime = (time: string) => time.split(/:|\./).map((x) => Number(x))

export default splitTime
