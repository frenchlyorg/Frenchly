// SEC-04: Rate limit triggers after 5 failed login attempts within 15 minutes
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
    get: (_name: string) => '192.168.1.1',
  }),
}))

// ─── Module mocks with factory fns ───────────────────────────────────────────
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }))

import { signIn } from '@/app/auth/actions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

/** Build a Supabase client mock where signInWithPassword succeeds or fails. */
function makeClientMock(opts: {
  authSucceeds: boolean
  role?: string
  captureInsert?: jest.Mock
}) {
  const { createClient } = require('@/lib/supabase/server')
  createClient.mockImplementation(async () => ({
    auth: {
      signInWithPassword: jest.fn().mockImplementation(async () =>
        opts.authSucceeds
          ? { data: { user: { id: 'user-uuid' } }, error: null }
          : { data: null, error: { message: 'Invalid login credentials' } }
      ),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { role: opts.role ?? 'student' },
            error: null,
          }),
        }),
      }),
    }),
  }))
}

/** Build an admin client mock with a given attempt count (for rate limit). */
function makeAdminMock(opts: { count: number; insertFn?: jest.Mock }) {
  const insertFn = opts.insertFn ?? jest.fn().mockResolvedValue({ error: null })
  const { createAdminClient } = require('@/lib/supabase/admin')
  createAdminClient.mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: opts.count }),
        }),
      }),
      insert: insertFn,
    }),
  }))
  return insertFn
}

const CREDS = { email: 'target@example.com', password: 'WrongPass123' }

beforeEach(() => {
  jest.clearAllMocks()
  // Default: not locked out, auth fails (wrong password)
  makeAdminMock({ count: 0 })
  makeClientMock({ authSucceeds: false })
})

// ─── Lockout threshold ───────────────────────────────────────────────────────

test('signIn is NOT blocked when attempt count is below threshold (4 attempts)', async () => {
  makeAdminMock({ count: 4 }) // below the 5-attempt threshold
  const result = await signIn(makeFormData(CREDS))
  // Proceeds to auth, gets wrong-password error (not lockout)
  expect(result?.message).toBe('Email or password incorrect.')
  expect(result?.message).not.toContain('15 minutes')
})

test('signIn is blocked after 5 failed attempts within 15 minutes (SEC-04)', async () => {
  makeAdminMock({ count: 5 }) // AT threshold — 6th attempt locked out
  const result = await signIn(makeFormData(CREDS))
  expect(result).toEqual({
    error: 'general',
    message: expect.stringContaining('15 minutes'),
  })
})

test('signIn is blocked when attempt count exceeds 5', async () => {
  makeAdminMock({ count: 10 })
  const result = await signIn(makeFormData(CREDS))
  expect(result?.message).toContain('15 minutes')
})

// ─── Lockout runs BEFORE auth call ──────────────────────────────────────────

test('signIn does NOT call auth.signInWithPassword when locked out (SEC-04)', async () => {
  makeAdminMock({ count: 5 })
  const mockSignInWithPassword = jest.fn()
  const { createClient } = require('@/lib/supabase/server')
  createClient.mockImplementation(async () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
    from: jest.fn(),
  }))

  await signIn(makeFormData(CREDS))
  expect(mockSignInWithPassword).not.toHaveBeenCalled()
})

// ─── Anti-enumeration via lockout ────────────────────────────────────────────

test('lockout message is returned for unknown email too — no enumeration (Pitfall 7)', async () => {
  makeAdminMock({ count: 5 })
  const result = await signIn(makeFormData({ email: 'unknown@nobody.com', password: 'any' }))
  expect(result?.message).toContain('15 minutes')
})

// ─── Rate limit resets after the window ─────────────────────────────────────

test('signIn rate limit resets after the 15-minute window expires (SEC-04)', async () => {
  // count=0 means window has passed — login should proceed and succeed
  makeAdminMock({ count: 0 })
  makeClientMock({ authSucceeds: true })
  await expect(
    signIn(makeFormData({ ...CREDS, password: 'CorrectPass99' }))
  ).rejects.toThrow('NEXT_REDIRECT:/dashboard')
})

// ─── Failed attempt recording ────────────────────────────────────────────────

test('failed attempt is recorded in login_attempts after a bad password', async () => {
  const mockInsertFn = jest.fn().mockResolvedValue({ error: null })
  makeAdminMock({ count: 0, insertFn: mockInsertFn })
  makeClientMock({ authSucceeds: false })

  await signIn(makeFormData(CREDS))
  expect(mockInsertFn).toHaveBeenCalledWith(
    expect.objectContaining({ email: CREDS.email })
  )
})

test('failed attempt is NOT recorded when already locked out', async () => {
  const mockInsertFn = jest.fn().mockResolvedValue({ error: null })
  makeAdminMock({ count: 5, insertFn: mockInsertFn })

  await signIn(makeFormData(CREDS))
  // Should return early — no insert call
  expect(mockInsertFn).not.toHaveBeenCalled()
})
