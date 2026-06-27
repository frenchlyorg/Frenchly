// Wave 0 scaffold — tests are RED until implementation plans complete.
// Covers AI-03 (rate limit blocks at 10 submissions), SEC-01 (unauthenticated → 401),
// and invalid body → 400.
// Route does not exist yet — will fail with module resolution error until Plan 02.

import { POST } from '@/app/api/check-writing/route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mock Supabase server client
// ---------------------------------------------------------------------------
const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue(mockSupabaseClient),
}))

// ---------------------------------------------------------------------------
// Mock Anthropic SDK
// ---------------------------------------------------------------------------
const mockMessagesCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
      },
    })),
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/check-writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// mockSubComponentCheck: mocks the CR-01 sub_components ownership query.
// .from('sub_components').select('id').eq('id', ...).single()
function mockSubComponentCheck(found = true) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(
      found
        ? { data: { id: 'e7f2d1a3-0000-4000-a000-000000000001' }, error: null }
        : { data: null, error: { message: 'not found' } }
    ),
  }
  mockFrom.mockReturnValueOnce(chain)
  return chain
}

// mockBurstGuard: mocks the CR-02 burst guard query.
// .from('writing_submissions').select('id').eq(...).eq(...).gte(...).limit(1).maybeSingle()
function mockBurstGuard(recentExists = false) {
  const result = recentExists
    ? { data: { id: 'some-row' }, error: null }
    : { data: null, error: null }
  // maybeSingle() is the terminal promise — the chain must resolve at that point.
  const maybeSingleMock = jest.fn().mockResolvedValue(result)
  const limitMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnValue({ limit: limitMock }),
  }
  mockFrom.mockReturnValueOnce(chain)
  return chain
}

// mockDailyCount: mocks the daily rate-limit count query.
// .from('writing_submissions').select('id', { count: 'exact', head: true }).eq(...).gte(...)
function mockDailyCount(count: number) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockResolvedValue({ count, error: null }),
  }
  mockFrom.mockReturnValueOnce(chain)
  return chain
}

// mockRateLimitUpsert: mocks the upsert that fires when rate-limited.
function mockRateLimitUpsert() {
  const chain = {
    upsert: jest.fn().mockResolvedValue({ error: null }),
  }
  mockFrom.mockReturnValueOnce(chain)
  return chain
}

// mockRateLimitCount: convenience helper for tests that just need auth + sub_component +
// burst guard + daily count all set up in one call (not rate limited).
function mockRateLimitCount(count: number) {
  mockSubComponentCheck(true)
  mockBurstGuard(false)
  mockDailyCount(count)
}

beforeEach(() => {
  // resetAllMocks clears mockReturnValueOnce queues (clearAllMocks does not).
  // We need fresh queue state per test so stale Once entries from a prior test
  // (e.g. the 400 test that returns before consuming DB mocks) don't leak.
  // The module-level jest.mock() factories re-run on each test file load, so
  // resetAllMocks here only resets call counts + queues, not the mock bindings.
  jest.resetAllMocks()
  // Re-wire createClient to return our shared mock client (reset clears the impl).
  const { createClient } = require('@/lib/supabase/server')
  createClient.mockResolvedValue(mockSupabaseClient)
})

describe('POST /api/check-writing', () => {
  it('returns 401 when user is not authenticated (SEC-01)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const req = makeRequest({ subComponentId: 'abc-123', text: 'Bonjour' })
    const res = await POST(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toMatchObject({ error: expect.any(String) })
  })

  it('returns 400 when body is missing subComponentId', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockRateLimitCount(0)

    const req = makeRequest({ text: 'Bonjour' }) // missing subComponentId
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 200 with rateLimited:true when DB count reaches 10 (AI-03: rate limit exceeded)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    // Route makes 4 from() calls when rate-limited:
    //   1. sub_components ownership check (CR-01)
    //   2. burst guard — no recent row (CR-02)
    //   3. daily count → 10 (triggers rate limit)
    //   4. rate-limit upsert (CR-03/WR-02 fix — stores friendly message)
    mockSubComponentCheck(true)
    mockBurstGuard(false)
    mockDailyCount(10)
    mockRateLimitUpsert()

    const req = makeRequest({
      subComponentId: 'e7f2d1a3-0000-4000-a000-000000000001',
      text: 'Je me lève à sept heures.',
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ rateLimited: true, feedback: expect.any(String) })

    // Anthropic must NOT be called when rate limited
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })
})
