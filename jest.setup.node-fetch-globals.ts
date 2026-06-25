/**
 * Setup file: inject Web Fetch API globals needed by next/server.
 *
 * jest-environment-jsdom does not include Request, Response, Headers, or
 * fetch. Next.js route handlers import from 'next/server', which uses the
 * global Request class. Without this, tests that import Route Handlers fail
 * with "ReferenceError: Request is not defined".
 *
 * Node 24 provides these as native globals. We extract them using a
 * synchronous eval in Node context via vm.runInThisContext — which bypasses
 * the jsdom vm context and returns the real Node globals.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const vm = require('vm') as typeof import('vm')

// Evaluate in the Node vm context (not the jsdom sandbox) to get the real
// native globals that Node 24 exposes.
function getNodeGlobal<T>(name: string): T | undefined {
  try {
    // vm.runInThisContext executes in the current V8 context — in jest workers
    // this is the Node.js context before jsdom's vm wrapping, so it has access
    // to Node 24's native globals.
    return vm.runInThisContext(name) as T
  } catch {
    return undefined
  }
}

const NativeRequest = getNodeGlobal<typeof Request>('Request')
const NativeResponse = getNodeGlobal<typeof Response>('Response')
const NativeHeaders = getNodeGlobal<typeof Headers>('Headers')
const nativeFetch = getNodeGlobal<typeof fetch>('fetch')

if (NativeRequest && typeof global.Request === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).Request = NativeRequest
}
if (NativeResponse && typeof global.Response === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).Response = NativeResponse
}
if (NativeHeaders && typeof global.Headers === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).Headers = NativeHeaders
}
if (nativeFetch && typeof global.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).fetch = nativeFetch
}
