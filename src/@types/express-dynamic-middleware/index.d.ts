declare module 'express-dynamic-middleware' {
  function MiddlewareFunc (req:any, res:any, next:any): Promise<void>
  export interface DynamicMiddleware {
    use(fn: MiddlewareFunc): number | undefined
    unuse(fn: MiddlewareFunc): void
    clean(): void
    handle(): MiddlewareFunc
    get(): MiddlewareFunc[]
  }
  function create(...fn:  MiddlewareFunc): DynamicMiddleware
}
