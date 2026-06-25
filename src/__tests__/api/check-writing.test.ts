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

// Supabase .from().select().eq().gte() chain returns { count, error }
function mockRateLimitCount(count: number) {
  const chainMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockResolvedValue({ count, error: null }),
  }
  mockFrom.mockReturnValue(chainMock)
  return chainMock
}

beforeEach(() => {
  jest.clearAllMocks()
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

    // DB count = 10 → rate limit triggers before Anthropic call
    // Second from() call is the audit upsert — mock resolves cleanly
    const chainMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockResolvedValue({ count: 10, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }
    mockFrom.mockReturnValue(chainMock)

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
