// LESSON-03: markSubComponentComplete — completed test suite
//
// Plan 03-03: flipped all five test.todo stubs to real passing tests.

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

// Track which table is being queried so we can return different data per call
let mockFromTable = ''

const mockSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockUpsert = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockImplementation(async () => ({
    auth: {
      getUser: jest.fn().mockImplementation(async () => mockGetUserResult),
    },
    from: jest.fn().mockImplementation((table: string) => {
      mockFromTable = table
      return {
        select: mockSelect,
        upsert: mockUpsert,
      }
    }),
  })),
}))

// NOTE: markSubComponentComplete is imported inside each test to ensure
// jest.mock() calls above are hoisted and processed first.

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserResult = {
    data: { user: { id: 'test-user-uuid-abcdef' } },
    error: null,
  }

  // Default select chain: sub_components existence check returns a valid sub-component,
  // lessons lookup returns lesson + level slug for revalidatePath
  mockEq.mockImplementation((col: string, val: string) => ({
    single: mockSingle,
  }))

  mockSelect.mockImplementation(() => ({
    eq: mockEq,
  }))

  // Default: sub_components check succeeds, lessons check succeeds
  mockSingle
    .mockResolvedValueOnce({
      data: { id: 'sc-uuid-1234', lesson_id: 'lesson-uuid-5678' },
      error: null,
    })
    .mockResolvedValueOnce({
      data: { id: 'lesson-uuid-5678', slug: 'greetings', level: { slug: 'french-1' } },
      error: null,
    })

  mockUpsert.mockResolvedValue({ error: null })
})

// ─── LESSON-03 tests ──────────────────────────────────────────────────────────

describe('markSubComponentComplete (LESSON-03)', () => {
  test('upserts a progress row for authenticated user', async () => {
    const { markSubComponentComplete } = await import('@/app/lessons/actions')

    await markSubComponentComplete('a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-uuid-abcdef',
        sub_component_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        completed_at: expect.any(String),
      }),
      expect.objectContaining({ onConflict: 'user_id,sub_component_id' })
    )
  })

  test('redirects to /login when unauthenticated', async () => {
    mockGetUserResult = { data: { user: null }, error: null }

    const { markSubComponentComplete } = await import('@/app/lessons/actions')

    await expect(
      markSubComponentComplete('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    ).rejects.toThrow('NEXT_REDIRECT:/login')

    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  test('throws on invalid UUID input', async () => {
    const { markSubComponentComplete } = await import('@/app/lessons/actions')

    await expect(
      markSubComponentComplete('not-a-valid-uuid')
    ).rejects.toThrow('Invalid sub-component ID')

    // No DB call should be made for invalid input
    expect(mockUpsert).not.toHaveBeenCalled()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  test('calls revalidatePath after successful upsert', async () => {
    const { markSubComponentComplete } = await import('@/app/lessons/actions')

    await markSubComponentComplete('a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      expect.stringMatching(/^\/levels\/.+\/lessons\/.+/)
    )
  })

  test('never accepts user_id from caller — resolves via getUser()', async () => {
    const { markSubComponentComplete } = await import('@/app/lessons/actions')

    // Provide a valid UUID — the only argument a caller can supply
    await markSubComponentComplete('a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    // The upserted user_id must equal the getUser() result, not something the caller provided
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-uuid-abcdef', // from mockGetUserResult — never from caller
      }),
      expect.anything()
    )

    // The action signature only accepts subComponentId — user_id is never a parameter
    // Confirm user_id is server-derived: it must equal what getUser() returned
    const upsertPayload = mockUpsert.mock.calls[0][0]
    expect(upsertPayload.user_id).toBe('test-user-uuid-abcdef')
    expect(upsertPayload.user_id).not.toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890') // not the subComponentId
  })
})
