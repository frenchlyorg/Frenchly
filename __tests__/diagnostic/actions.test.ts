export {} // module scope — isolate top-level test mocks from other test files

// DIAG-01: diagnostic Server Action security-contract tests.
//
// Asserts the security boundary: client score never trusted (score recomputed from
// DB-stored answers), the watermark unlock uses the ADMIN client, retake is blocked,
// unauthenticated callers redirect, and invalid input throws before any DB call.

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

// ─── Shared mock state (mock-prefixed so jest.mock factories may reference) ────
let mockGetUserResult: { data: { user: { id: string } | null } }
let mockServerQueues: Record<string, unknown[]>

// ─── Mock authenticated server client (per-table FIFO result queues) ──────────
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { getUser: jest.fn(async () => mockGetUserResult) },
    from: jest.fn((table: string) => {
      const shift = () => {
        const q = mockServerQueues[table] || []
        if (q.length === 0) throw new Error(`mock: no queued result for "${table}"`)
        return q.shift()
      }
      const chain: Record<string, unknown> = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        upsert: () => chain,
        eq: () => chain,
        in: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => Promise.resolve(shift()),
        maybeSingle: () => Promise.resolve(shift()),
        then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
          Promise.resolve(shift()).then(res, rej),
      }
      return chain
    }),
  })),
}))

// ─── Mock admin client (answer-key read + watermark write) ────────────────────
const mockAdminUpdate = jest.fn()
const mockAdminProfilesEq = jest.fn()
let mockAdminQuestion: unknown

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          update: (payload: unknown) => {
            mockAdminUpdate(payload)
            return {
              eq: (col: string, val: string) => {
                mockAdminProfilesEq(col, val)
                return Promise.resolve({ error: null })
              },
            }
          },
        }
      }
      // diagnostic_questions — answer key read
      return {
        select: () => ({
          eq: () => ({ single: () => Promise.resolve(mockAdminQuestion) }),
        }),
      }
    },
  })),
}))

const ATTEMPT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const QUESTION_ID = 'f1e2d3c4-b5a6-7890-abcd-ef1234567890'

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUserResult = { data: { user: { id: 'test-user-uuid' } } }
  mockServerQueues = {}
  mockAdminQuestion = {
    data: {
      id: QUESTION_ID,
      level_id: 'lvl1',
      type: 'mc',
      question_text: 'Definite article for "livre"?',
      options: ['le', 'la', 'les'],
      correct_answer: 'le',
      lesson_tag: 'definite-articles',
      position: 1,
    },
  }
})

describe('submitDiagnosticAnswer — security contract', () => {
  test('throws "Invalid input" before any DB call on non-UUID ids', async () => {
    const { submitDiagnosticAnswer } = await import('@/actions/diagnostic')
    await expect(
      submitDiagnosticAnswer({ attemptId: 'nope', questionId: 'nope', answer: 'x' })
    ).rejects.toThrow('Invalid input')
    expect(mockAdminUpdate).not.toHaveBeenCalled()
  })

  test('redirects to /login when unauthenticated', async () => {
    mockGetUserResult = { data: { user: null } }
    const { submitDiagnosticAnswer } = await import('@/actions/diagnostic')
    await expect(
      submitDiagnosticAnswer({ attemptId: ATTEMPT_ID, questionId: QUESTION_ID, answer: 'le' })
    ).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
    expect(mockAdminUpdate).not.toHaveBeenCalled()
  })

  test('on completion: scores from DB answers and unlocks via the ADMIN client with server-derived user_id', async () => {
    mockServerQueues = {
      diagnostic_attempts: [
        {
          data: {
            id: ATTEMPT_ID,
            user_id: 'test-user-uuid',
            level_id: 'lvl1',
            status: 'in_progress',
            drawn_question_ids: [QUESTION_ID],
            diagnostic_type: 'placement',
            started_at: new Date().toISOString(),
          },
        },
        { error: null }, // attempts.update
      ],
      diagnostic_answers: [
        { error: null }, // upsert
        { data: [{ question_id: QUESTION_ID, is_correct: true }] }, // select all answers
      ],
      levels: [{ data: { id: 'level-2-uuid' } }],
    }

    const { submitDiagnosticAnswer } = await import('@/actions/diagnostic')
    // On completion the action redirects to the result screen (after the unlock write).
    await expect(
      submitDiagnosticAnswer({ attemptId: ATTEMPT_ID, questionId: QUESTION_ID, answer: 'le' })
    ).rejects.toThrow('NEXT_REDIRECT:/diagnostic/placement?result=1')

    // Unlock went through the admin client, scored 100% → French 2 (watermark 2).
    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ unlocked_through_level_number: 2, current_level_id: 'level-2-uuid' })
    )
    // user_id is server-derived (getUser), never from the caller.
    expect(mockAdminProfilesEq).toHaveBeenCalledWith('id', 'test-user-uuid')
  })
})

describe('startPlacementDiagnostic — one-time guard', () => {
  test('blocks a retake when a completed placement exists (redirects to /dashboard)', async () => {
    mockServerQueues = {
      diagnostic_attempts: [{ data: [{ id: 'old', status: 'completed' }] }],
    }
    const { startPlacementDiagnostic } = await import('@/actions/diagnostic')
    await expect(startPlacementDiagnostic()).rejects.toThrow('NEXT_REDIRECT:/dashboard')
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  test('redirects to /login when unauthenticated', async () => {
    mockGetUserResult = { data: { user: null } }
    const { startPlacementDiagnostic } = await import('@/actions/diagnostic')
    await expect(startPlacementDiagnostic()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})

const LEVEL_ID = 'c1d2e3f4-a5b6-7890-abcd-ef1234567890'

describe('startEndOfLevelDiagnostic + end-of-level grading (DIAG-02)', () => {
  test('blocks a retry while a prior failed attempt cooldown is active', async () => {
    mockServerQueues = {
      levels: [{ data: { slug: 'french-1' } }],
      diagnostic_attempts: [
        { data: { id: 'old', status: 'failed', cooldown_until: new Date(Date.now() + 3_600_000).toISOString() } },
      ],
    }
    const { startEndOfLevelDiagnostic } = await import('@/actions/diagnostic')
    await expect(startEndOfLevelDiagnostic({ levelId: LEVEL_ID })).rejects.toThrow('Cooldown active')
  })

  test('re-draws and starts when no active cooldown (redirects to the end-of-level page)', async () => {
    mockServerQueues = {
      levels: [{ data: { slug: 'french-1' } }],
      diagnostic_attempts: [{ data: null }, { error: null }], // latest=none, insert
      diagnostic_questions: [{ data: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }] }], // pool
    }
    const { startEndOfLevelDiagnostic } = await import('@/actions/diagnostic')
    await expect(startEndOfLevelDiagnostic({ levelId: LEVEL_ID })).rejects.toThrow(
      'NEXT_REDIRECT:/diagnostic/end-of-level/french-1'
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/diagnostic/end-of-level/french-1')
  })

  test('redirects to /login when unauthenticated', async () => {
    mockGetUserResult = { data: { user: null } }
    const { startEndOfLevelDiagnostic } = await import('@/actions/diagnostic')
    await expect(startEndOfLevelDiagnostic({ levelId: LEVEL_ID })).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  test('passing advances the watermark to level_number + 1 via the ADMIN client', async () => {
    mockServerQueues = {
      diagnostic_attempts: [
        {
          data: {
            id: ATTEMPT_ID,
            user_id: 'test-user-uuid',
            level_id: 'lvl1',
            status: 'in_progress',
            drawn_question_ids: [QUESTION_ID],
            diagnostic_type: 'end_of_level',
            started_at: new Date().toISOString(),
          },
        },
        { error: null }, // attempts.update
      ],
      diagnostic_answers: [
        { error: null }, // upsert
        { data: [{ question_id: QUESTION_ID, is_correct: true }] }, // all answers
      ],
      levels: [
        { data: { level_number: 1, slug: 'french-1' } }, // this level (by id)
        { data: { id: 'level-2-uuid' } }, // next level (by level_number)
      ],
    }

    const { submitDiagnosticAnswer } = await import('@/actions/diagnostic')
    await expect(
      submitDiagnosticAnswer({ attemptId: ATTEMPT_ID, questionId: QUESTION_ID, answer: 'le' })
    ).rejects.toThrow('NEXT_REDIRECT:/diagnostic/end-of-level/french-1')

    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ unlocked_through_level_number: 2, current_level_id: 'level-2-uuid' })
    )
  })
})
