// SEC-03 (path-protection behavior): proxy redirects unauthenticated requests to /login
// with next= param; authenticated requests pass through without redirect.
//
// The proxy function (src/app/proxy.ts) is tested here with a mocked Supabase client
// so no live DB is required.

// ─── Mock @supabase/ssr ───────────────────────────────────────────────────────

let mockGetUser: jest.Mock

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn().mockImplementation(() => ({
    auth: {
      getUser: () => mockGetUser(),
    },
  })),
}))

// ─── Mock next/server ────────────────────────────────────────────────────────
// We replicate the minimal NextResponse/NextRequest API the proxy uses.

const mockRedirectFn = jest.fn()
const mockNextFn = jest.fn()

// Track cookies set/get on the mock request
const mockRequestCookies = {
  getAll: jest.fn().mockReturnValue([]),
  set: jest.fn(),
}

class MockNextRequest {
  url: string
  nextUrl: URL
  cookies: typeof mockRequestCookies

  constructor(url: string) {
    this.url = url
    this.nextUrl = new URL(url)
    this.cookies = mockRequestCookies
  }
}

const mockResponseCookies = {
  set: jest.fn(),
}

const mockNextResponse = {
  cookies: mockResponseCookies,
}

jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn(() => mockNextResponse),
      redirect: jest.fn((url: URL) => {
        mockRedirectFn(url.toString())
        return { redirected: true, url: url.toString() }
      }),
    },
    // NextRequest is used only as a type in proxy.ts, not constructed there
  }
})

import { proxy } from '@/app/proxy'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(pathname: string, base = 'http://localhost:3000') {
  return new MockNextRequest(`${base}${pathname}`) as unknown as Parameters<typeof proxy>[0]
}

function simulateNoUser() {
  mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } })
}

function simulateAuthenticatedUser() {
  mockGetUser = jest.fn().mockResolvedValue({ data: { user: { id: 'user-uuid-123' } } })
}

beforeEach(() => {
  jest.clearAllMocks()
  // Reset mock request cookie helpers
  mockRequestCookies.getAll.mockReturnValue([])
  mockRequestCookies.set.mockReset()
  mockResponseCookies.set.mockReset()
  // Default to authenticated
  simulateAuthenticatedUser()

  const { NextResponse } = require('next/server')
  NextResponse.next.mockReturnValue(mockNextResponse)
})

// ─── Unauthenticated → protected path → /login redirect ──────────────────────

test('proxy redirects unauthenticated request to /dashboard to /login?next=/dashboard (SEC-03)', async () => {
  simulateNoUser()
  const response = await proxy(makeRequest('/dashboard'))

  expect(mockRedirectFn).toHaveBeenCalledTimes(1)
  const redirectUrl = mockRedirectFn.mock.calls[0][0] as string
  expect(redirectUrl).toContain('/login')
  expect(redirectUrl).toContain('next=%2Fdashboard')
})

test('proxy redirects unauthenticated request to /admin to /login?next=/admin (SEC-03)', async () => {
  simulateNoUser()
  const response = await proxy(makeRequest('/admin'))

  expect(mockRedirectFn).toHaveBeenCalledTimes(1)
  const redirectUrl = mockRedirectFn.mock.calls[0][0] as string
  expect(redirectUrl).toContain('/login')
  expect(redirectUrl).toContain('next=%2Fadmin')
})

test('proxy redirects unauthenticated request to /account to /login?next=/account (SEC-03)', async () => {
  simulateNoUser()
  const response = await proxy(makeRequest('/account'))

  expect(mockRedirectFn).toHaveBeenCalledTimes(1)
  const redirectUrl = mockRedirectFn.mock.calls[0][0] as string
  expect(redirectUrl).toContain('/login')
  expect(redirectUrl).toContain('next=%2Faccount')
})

test('proxy passes authenticated request to protected route without redirect (SEC-03)', async () => {
  simulateAuthenticatedUser()
  await proxy(makeRequest('/dashboard'))

  expect(mockRedirectFn).not.toHaveBeenCalled()
})

// ─── Unauthenticated → public path → no redirect ─────────────────────────────

test('proxy does not redirect unauthenticated request to public path (/login)', async () => {
  simulateNoUser()
  await proxy(makeRequest('/login'))

  expect(mockRedirectFn).not.toHaveBeenCalled()
})

test('proxy does not redirect unauthenticated request to / (public)', async () => {
  simulateNoUser()
  await proxy(makeRequest('/'))

  expect(mockRedirectFn).not.toHaveBeenCalled()
})

// ─── Deep protected sub-paths ─────────────────────────────────────────────────

test('proxy redirects unauthenticated request to /dashboard/settings (sub-path) (SEC-03)', async () => {
  simulateNoUser()
  await proxy(makeRequest('/dashboard/settings'))

  expect(mockRedirectFn).toHaveBeenCalledTimes(1)
  const redirectUrl = mockRedirectFn.mock.calls[0][0] as string
  expect(redirectUrl).toContain('/login')
  expect(redirectUrl).toContain('next=')
})
