// SEC-01: Vague error returned for bad credentials — no information disclosure
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
let mockSignInError: { message: string } | null

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      signInWithPassword: jest.fn().mockImplementation(async () => ({
        data: null,
        error: mockSignInError,
      })),
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
  createAdminClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

import { signIn } from '@/app/auth/actions'

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSignInError = null
})

// ─── Vague error message ─────────────────────────────────────────────────────

test('signIn returns a vague error message for invalid credentials (SEC-01)', async () => {
  mockSignInError = { message: 'Invalid login credentials' }
  const result = await signIn(makeFormData({ email: 'user@example.com', password: 'WrongPass1' }))
  expect(result).toEqual({
    error: 'general',
    message: 'Email or password incorrect.',
  })
})

test('error message is exactly "Email or password incorrect." — no extra detail (D-13)', async () => {
  mockSignInError = { message: 'Email not confirmed' }
  const result = await signIn(makeFormData({ email: 'user@example.com', password: 'WrongPass1' }))
  // Must be the vague string regardless of the actual Supabase error
  expect(result?.message).toBe('Email or password incorrect.')
})

// ─── No email enumeration ────────────────────────────────────────────────────

test('signIn does not reveal whether email exists — same error for unknown email (SEC-01)', async () => {
  // Supabase returns "Invalid login credentials" for both wrong password AND unknown email
  mockSignInError = { message: 'Invalid login credentials' }

  const resultUnknownEmail = await signIn(
    makeFormData({ email: 'notregistered@example.com', password: 'AnyPass123' })
  )
  const resultWrongPassword = await signIn(
    makeFormData({ email: 'known@example.com', password: 'WrongPass123' })
  )

  // Both must return the same vague message — no difference that would reveal registration status
  expect(resultUnknownEmail?.message).toBe(resultWrongPassword?.message)
  expect(resultUnknownEmail?.message).toBe('Email or password incorrect.')
})

test('error.error field is always "general" for login failures — never leaks field name (SEC-01)', async () => {
  mockSignInError = { message: 'Invalid login credentials' }
  const result = await signIn(makeFormData({ email: 'test@example.com', password: 'WrongPass1' }))
  expect(result?.error).toBe('general')
})

// ─── Failed attempt recording ────────────────────────────────────────────────

test('signIn records a failed attempt to login_attempts table on bad credentials', async () => {
  mockSignInError = { message: 'Invalid login credentials' }
  // The admin client is called twice in signIn: once for rate-limit check, once for insert.
  // We need to track inserts across both calls. Use a shared mockInsertFn.
  const mockInsertFn = jest.fn().mockResolvedValue({ error: null })
  const { createAdminClient } = require('@/lib/supabase/admin')
  createAdminClient.mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
      insert: mockInsertFn,
    }),
  }))

  await signIn(makeFormData({ email: 'test@example.com', password: 'WrongPass1' }))
  expect(mockInsertFn).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'test@example.com' })
  )
})
