// LESSON-03: markSubComponentComplete — Wave 0 scaffold
//
// This file contains the mock infrastructure and test.todo stubs for Plan 03.
// Plan 03 will create '@/app/lessons/actions' and flip these todos to real tests.
//
// All five LESSON-03 behaviors are documented here as test.todo so:
//   - npm test stays green (todos count, not fail)
//   - The action is NOT imported at module top level (import-safe — file doesn't fail
//     before the module exists)
//   - Plan 03 can import and fill in test bodies without restructuring mocks

// ─── Mock next/navigation ────────────────────────────────────────────────────
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

// ─── Mock next/cache ─────────────────────────────────────────────────────────
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}))

// ─── Shared mock state ───────────────────────────────────────────────────────
let mockGetUserResult: { data: { user: { id: string } | null }; error: null }

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async () => mockGetUserResult),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'sc-uuid-1234', lesson_id: 'lesson-uuid-5678' },
            error: null,
          }),
        }),
      }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }),
  })),
}))

// NOTE: markSubComponentComplete is NOT imported at top level here.
// Import it inside each real test body once Plan 03 creates '@/app/lessons/actions'.
// Doing a top-level import before the module exists causes a module-not-found error
// that fails the entire test suite.

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserResult = {
    data: { user: { id: 'test-user-uuid-abcdef' } },
    error: null,
  }
})

// ─── LESSON-03 test stubs (Plan 03 will flip these to real tests) ─────────────

describe('markSubComponentComplete (LESSON-03)', () => {
  test.todo('upserts a progress row for authenticated user')

  test.todo('redirects to /login when unauthenticated')

  test.todo('throws on invalid UUID input')

  test.todo('calls revalidatePath after successful upsert')

  test.todo('never accepts user_id from caller — resolves via getUser()')
})
