// AUTH-03: signOut clears session and redirects to /
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
let mockSignOutResult: { error: null | { message: string } }

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      signOut: jest.fn().mockImplementation(async () => mockSignOutResult),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  })),
}))

// Admin client mock — not used by signOut but needed to satisfy module import
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
    auth: {
      admin: {
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
      },
    },
  })),
}))

import { signOut } from '@/app/auth/actions'

beforeEach(() => {
  jest.clearAllMocks()
  mockSignOutResult = { error: null }
})

// ─── Successful logout ───────────────────────────────────────────────────────

test('signOut clears session and redirects to / (AUTH-03)', async () => {
  await expect(signOut()).rejects.toThrow('NEXT_REDIRECT:/')
  expect(mockRedirect).toHaveBeenCalledWith('/')
})

test('signOut calls supabase.auth.signOut() (AUTH-03)', async () => {
  const { createClient } = require('@/lib/supabase/server')
  const mockSignOutFn = jest.fn().mockResolvedValue({ error: null })
  createClient.mockImplementationOnce(async () => ({
    auth: {
      signOut: mockSignOutFn,
    },
  }))

  await expect(signOut()).rejects.toThrow('NEXT_REDIRECT:/')
  expect(mockSignOutFn).toHaveBeenCalledTimes(1)
})

test('signOut called when not signed in completes without error (AUTH-03)', async () => {
  mockSignOutResult = { error: null }
  // Should still redirect even if not signed in
  await expect(signOut()).rejects.toThrow('NEXT_REDIRECT:/')
  expect(mockRedirect).toHaveBeenCalledWith('/')
})
