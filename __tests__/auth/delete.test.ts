// AUTH-04: deleteAccount anonymizes PII in profiles table and soft-deletes auth user
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
const TEST_USER_ID = 'user-uuid-abcdef123456'

let mockGetUserResult: { data: { user: { id: string } | null }; error: null | { message: string } }
let mockDeleteUserResult: { error: null | { message: string } }
let mockProfilesUpdateResult: { error: null | { message: string } }

// Track calls for assertions
const mockProfilesUpdateFn = jest.fn()
const mockProfilesEqFn = jest.fn()
const mockAdminDeleteUserFn = jest.fn()
const mockServerSignOutFn = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async () => mockGetUserResult),
      signOut: mockServerSignOutFn.mockResolvedValue({ error: null }),
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

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ count: 0 }),
        }),
      }),
      update: mockProfilesUpdateFn.mockReturnValue({
        eq: mockProfilesEqFn.mockImplementation(async () => mockProfilesUpdateResult),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      admin: {
        deleteUser: mockAdminDeleteUserFn.mockImplementation(async () => mockDeleteUserResult),
      },
    },
  })),
}))

import { deleteAccount } from '@/app/auth/actions'

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserResult = {
    data: { user: { id: TEST_USER_ID } },
    error: null,
  }
  mockDeleteUserResult = { error: null }
  mockProfilesUpdateResult = { error: null }
  // Re-assign mocks after clearAllMocks
  mockProfilesUpdateFn.mockReturnValue({
    eq: mockProfilesEqFn.mockImplementation(async () => mockProfilesUpdateResult),
  })
  mockAdminDeleteUserFn.mockImplementation(async () => mockDeleteUserResult)
  mockServerSignOutFn.mockResolvedValue({ error: null })
})

// ─── PII anonymization ───────────────────────────────────────────────────────

test('deleteAccount anonymizes username and sets deleted_at in profiles row (AUTH-04)', async () => {
  await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT:/')

  // Verify profile was updated with anonymized data
  expect(mockProfilesUpdateFn).toHaveBeenCalledWith(
    expect.objectContaining({
      username: expect.stringMatching(/^deleted_/),
      deleted_at: expect.any(String),
    })
  )
})

test('deleteAccount anonymizes username with deleted_ prefix + id slice (AUTH-04)', async () => {
  await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT:/')

  const updateCall = mockProfilesUpdateFn.mock.calls[0]?.[0]
  expect(updateCall).toBeDefined()
  // Username should start with 'deleted_' followed by first 8 chars of the user id
  const expectedPrefix = 'deleted_' + TEST_USER_ID.slice(0, 8)
  expect(updateCall.username).toBe(expectedPrefix)
})

test('deleteAccount calls admin.deleteUser with shouldSoftDelete=true (AUTH-04)', async () => {
  await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT:/')

  expect(mockAdminDeleteUserFn).toHaveBeenCalledWith(TEST_USER_ID, true)
})

test('deleteAccount resolves user id server-side via getUser (T-02-15)', async () => {
  const { createClient } = require('@/lib/supabase/server')
  const mockGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: TEST_USER_ID } },
    error: null,
  })

  createClient.mockImplementationOnce(async () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockServerSignOutFn,
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }))

  await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT:/')
  // Must call getUser to resolve authenticated user id — never trust client input
  expect(mockGetUser).toHaveBeenCalledTimes(1)
})

test('deleteAccount removes auth.users row after anonymizing profiles (AUTH-04)', async () => {
  await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT:/')

  // Verify order: profile update first, then deleteUser
  const profileUpdateOrder = mockProfilesUpdateFn.mock.invocationCallOrder[0]
  const deleteUserOrder = mockAdminDeleteUserFn.mock.invocationCallOrder[0]
  expect(profileUpdateOrder).toBeLessThan(deleteUserOrder)
})

test('deleteAccount redirects to / after deletion (AUTH-04)', async () => {
  await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT:/')
  expect(mockRedirect).toHaveBeenCalledWith('/')
})
