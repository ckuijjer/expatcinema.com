declare module 'x-ray-crawler' {
  export type DriverContext = {
    url: string
    body?: unknown
  }

  export type DriverCallback = (error: unknown, result: unknown) => void

  export type Driver = (
    context: DriverContext,
    callback: DriverCallback,
  ) => void | Promise<void>

  export type RequestHook = (request: unknown) => void
  export type ResponseHook = (response: unknown) => void
  export type RandomDelay = () => number

  export interface InstanceInvocation {
    (callback: DriverCallback): void
    (source: string, callback: DriverCallback): void
    abort(arg: unknown): this
    paginate(selector: unknown): this
    limit(n: number): this
    stream(): NodeJS.ReadStream
    then<U>(fn?: (value: unknown) => U | PromiseLike<U>): Promise<U>
    write(path?: string): (err: NodeJS.ErrnoException) => void
  }

  export interface Instance {
    (url: string, callback: DriverCallback): void
    driver(): Driver
    driver(driver: Driver): this
    throttle(): number
    throttle(requests: string | number, rate: string | number): this
    delay(): RandomDelay
    delay(from: string | number, to?: string | number): this
    timeout(): number
    timeout(n: string | number): this
    concurrency(): number
    concurrency(n: number): this
    request(): RequestHook
    request(fn: RequestHook): this
    response(): ResponseHook
    response(fn: ResponseHook): this
    limit(): number
    limit(n: number): this
  }

  export default function XRayCrawler(driver?: Driver): Instance
}
