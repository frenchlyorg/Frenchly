// AUTH-02: signIn returns session; signIn with wrong password returns error
// Mocks Supabase clients — no live DB required

// ─── Mock next/navigation ────────────────────────────────────────────────────
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

// ─── Mock next/headers ──────────────────────────────────────────────────────
jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: (_name: string) => '127.0.0.1',
  }),
}))

// ─── Shared mock state ───────────────────────────────────────────────────────
let mockSignInResult: { data: { user: { id: string } } | null; error: { message: string } | null }
let mockRateLimitCount: number

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      signInWithPassword: jest.fn().mockImplementation(async () => mockSignInResult),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { role: 'student' }, error: null }),
        }),
      }),
    }),
  })),
}))

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockImplementation(async () => ({ count: mockRateLimitCount })),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  })),
}))

import { signIn } from '@/app/auth/actions'

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

const VALID_CREDS = { email: 'bob@example.com', password: 'ValidPass99!' }

beforeEach(() => {
  jest.clearAllMocks()
  mockRateLimitCount = 0
  mockSignInResult = {
    data: { user: { id: 'user-uuid-123' } },
    error: null,
  }
})

// ─── Successful login ────────────────────────────────────────────────────────

test('signIn returns a valid session and redirects to /dashboard (AUTH-02)', async () => {
  await expect(signIn(makeFormData(VALID_CREDS))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
})

test('signIn redirects admin user to /admin (D-16)', async () => {
  const { createClient } = require('@/lib/supabase/server')
  createClient.mockImplementationOnce(async () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-uuid' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
        }),
      }),
    }),
  }))

  await expect(signIn(makeFormData(VALID_CREDS))).rejects.toThrow('NEXT_REDIRECT:/admin')
  expect(mockRedirect).toHaveBeenCalledWith('/admin')
})

// ─── Wrong password ──────────────────────────────────────────────────────────

test('signIn with wrong password returns error without session (AUTH-02)', async () => {
  mockSignInResult = {
    data: null,
    error: { message: 'Invalid login credentials' },
  }
  const result = await signIn(makeFormData(VALID_CREDS))
  expect(result).toEqual({
    error: 'general',
    message: 'Email or password incorrect.',
  })
  expect(mockRedirect).not.toHaveBeenCalled()
})

// ─── Role-based redirect ─────────────────────────────────────────────────────

test('signIn reads role from profiles table, not user_metadata', async () => {
  const { createClient } = require('@/lib/supabase/server')
  const mockSingle = jest.fn().mockResolvedValue({ data: { role: 'student' }, error: null })
  const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = jest.fn().mockReturnValue({ select: mockSelect })

  createClient.mockImplementationOnce(async () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-uuid-123' } },
        error: null,
      }),
    },
    from: mockFrom,
  }))

  await expect(signIn(makeFormData(VALID_CREDS))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  // Verify we queried profiles table for the role
  expect(mockFrom).toHaveBeenCalledWith('profiles')
  expect(mockSelect).toHaveBeenCalledWith('role')
})
