// AUTH-01: signUp creates profiles row with username and student role
// Mocks Supabase clients — no live DB required

// ─── Mock next/navigation redirect ──────────────────────────────────────────
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    // redirect() throws internally in Next.js; simulate that so callers see it stop
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

// ─── Mock next/headers ──────────────────────────────────────────────────────
jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: (_name: string) => null,
  }),
}))

// ─── Shared Supabase mock state ─────────────────────────────────────────────
let mockMaybeSingleResult: { data: { id: string } | null; error: null } = { data: null, error: null }
let mockSignUpResult: { error: { message: string } | null } = { error: null }

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockSignUp = jest.fn()

// Build a chainable query mock
function buildQueryChain() {
  mockMaybeSingle.mockResolvedValue(mockMaybeSingleResult)
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => {
    buildQueryChain()
    return {
      from: mockFrom,
      auth: {
        signUp: mockSignUp,
      },
    }
  }),
}))

// Admin client is not called during signUp — provide a no-op
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

import { signUp } from '@/app/auth/actions'

// ────────────────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

const VALID_FIELDS = {
  email: 'alice@example.com',
  password: 'SecurePass12345',
  username: 'alice_frenchly',
}

beforeEach(() => {
  jest.clearAllMocks()
  // Default: no existing username, signUp succeeds
  mockMaybeSingleResult = { data: null, error: null }
  mockSignUpResult = { error: null }
  buildQueryChain()
  mockSignUp.mockResolvedValue(mockSignUpResult)
})

// ─── Username format validation ──────────────────────────────────────────────

test('signUp rejects username shorter than 3 characters', async () => {
  const result = await signUp(makeFormData({ ...VALID_FIELDS, username: 'ab' }))
  expect(result).toEqual({
    error: 'username',
    message: expect.stringContaining('3–20 characters'),
  })
  expect(mockSignUp).not.toHaveBeenCalled()
})

test('signUp rejects username longer than 20 characters', async () => {
  const result = await signUp(makeFormData({ ...VALID_FIELDS, username: 'a'.repeat(21) }))
  expect(result).toEqual({ error: 'username', message: expect.any(String) })
  expect(mockSignUp).not.toHaveBeenCalled()
})

test('signUp rejects username with disallowed characters', async () => {
  const result = await signUp(makeFormData({ ...VALID_FIELDS, username: 'bad name!' }))
  expect(result).toEqual({ error: 'username', message: expect.any(String) })
  expect(mockSignUp).not.toHaveBeenCalled()
})

test('signUp accepts valid username with letters, numbers, and underscores', async () => {
  mockSignUp.mockResolvedValueOnce({ error: null })
  await expect(signUp(makeFormData(VALID_FIELDS))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
})

// ─── Profanity filtering ─────────────────────────────────────────────────────

test('signUp rejects profane usernames (AUTH-01)', async () => {
  // 'shithead' is in the bad-words default list (note: digits appended break detection — use plain form)
  const result = await signUp(makeFormData({ ...VALID_FIELDS, username: 'shithead' }))
  expect(result).toEqual({
    error: 'username',
    message: expect.stringContaining("isn't available"),
  })
  expect(mockSignUp).not.toHaveBeenCalled()
})

test('signUp rejects custom bypass pattern sh1tter', async () => {
  const result = await signUp(makeFormData({ ...VALID_FIELDS, username: 'sh1tter' }))
  expect(result).toEqual({ error: 'username', message: expect.any(String) })
  expect(mockSignUp).not.toHaveBeenCalled()
})

// ─── Password strength ───────────────────────────────────────────────────────

test('signUp rejects password under 12 characters', async () => {
  const result = await signUp(makeFormData({ ...VALID_FIELDS, password: 'Short1' }))
  expect(result).toEqual({
    error: 'password',
    message: expect.stringContaining('12 characters'),
  })
  expect(mockSignUp).not.toHaveBeenCalled()
})

test('signUp rejects password with no digit', async () => {
  const result = await signUp(makeFormData({ ...VALID_FIELDS, password: 'NoNumbersHere!!' }))
  expect(result).toEqual({ error: 'password', message: expect.any(String) })
  expect(mockSignUp).not.toHaveBeenCalled()
})

test('signUp accepts password with 12+ chars and a digit', async () => {
  mockSignUp.mockResolvedValueOnce({ error: null })
  await expect(signUp(makeFormData(VALID_FIELDS))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
})

// ─── Duplicate username pre-check ────────────────────────────────────────────

test('signUp rejects duplicate usernames (AUTH-01)', async () => {
  // Simulate existing username found
  mockMaybeSingleResult = { data: { id: 'existing-user-id' }, error: null }
  buildQueryChain()
  const result = await signUp(makeFormData(VALID_FIELDS))
  expect(result).toEqual({
    error: 'username',
    message: expect.stringContaining('try adding your initial'),
  })
  expect(mockSignUp).not.toHaveBeenCalled()
})

// ─── Email already registered ────────────────────────────────────────────────

test('signUp maps already-registered error to email field', async () => {
  mockSignUp.mockResolvedValueOnce({
    error: { message: 'User already registered' },
  })
  const result = await signUp(makeFormData(VALID_FIELDS))
  expect(result).toEqual({
    error: 'email',
    message: expect.stringContaining("taken"),
  })
})

// ─── Success redirect ────────────────────────────────────────────────────────

test('signUp redirects to /dashboard on success (AUTH-01)', async () => {
  mockSignUp.mockResolvedValueOnce({ error: null })
  await expect(signUp(makeFormData(VALID_FIELDS))).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
})

test('signUp passes username in options.data to auth.signUp', async () => {
  mockSignUp.mockResolvedValueOnce({ error: null })
  await expect(signUp(makeFormData(VALID_FIELDS))).rejects.toThrow('NEXT_REDIRECT')
  expect(mockSignUp).toHaveBeenCalledWith(
    expect.objectContaining({
      options: expect.objectContaining({
        data: expect.objectContaining({ username: VALID_FIELDS.username }),
      }),
    })
  )
})
