// Wave 0 scaffold — tests are RED until implementation plans complete.
// Covers AI-01 (render, prompt text), AI-04 (fallback on error, 429 rate limit).
// WrittenCard does not exist yet — will fail with module resolution error until Plan 03.

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import WrittenCard from '@/components/practice/WrittenCard'
import type { WrittenProblem } from '@/lib/practice/types'

// Mock the server action so no real network calls are made
jest.mock('@/app/lessons/actions', () => ({
  markSubComponentComplete: jest.fn().mockResolvedValue(undefined),
}))

const mockProblem: WrittenProblem = {
  type: 'written',
  prompt: 'Describe your morning routine in 3–5 sentences.',
}

const defaultProps = {
  problem: mockProblem,
  subComponentId: 'sub-123',
  isCompleted: false,
  onComplete: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('WrittenCard', () => {
  it('renders the prompt text from WrittenProblem.prompt', () => {
    render(<WrittenCard {...defaultProps} />)
    expect(
      screen.getByText('Describe your morning routine in 3–5 sentences.')
    ).toBeInTheDocument()
  })

  it('"Check my writing" button is present and enabled when text is entered', () => {
    render(<WrittenCard {...defaultProps} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Je me lève à sept heures.' } })

    const button = screen.getByRole('button', { name: /check my writing/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('textarea is disabled and feedback is shown after successful submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ feedback: 'Bien!' }),
    })

    render(<WrittenCard {...defaultProps} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Je me lève à sept heures.' } })

    const button = screen.getByRole('button', { name: /check my writing/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Bien!')).toBeInTheDocument()
    })
    expect(textarea).toBeDisabled()
  })

  it('on fetch returning rateLimited:true, shows rate limit message', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ feedback: "You've used all your writing checks for today — come back tomorrow!", rateLimited: true }),
    })

    render(<WrittenCard {...defaultProps} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Je me lève à sept heures.' } })

    const button = screen.getByRole('button', { name: /check my writing/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText(
          "You've used all your writing checks for today — come back tomorrow!"
        )
      ).toBeInTheDocument()
    })
  })

  it('on fetch network error, shows graceful fallback message (D-06)', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<WrittenCard {...defaultProps} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Je me lève à sept heures.' } })

    const button = screen.getByRole('button', { name: /check my writing/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.getByText("We couldn't check that right now — keep going!")
      ).toBeInTheDocument()
    })
  })

  it('when isCompleted=true and initialFeedback provided, renders feedback on mount without fetch (D-08, D-09)', () => {
    render(
      <WrittenCard
        {...defaultProps}
        isCompleted={true}
        initialFeedback="Très bien! Tes phrases sont claires."
      />
    )

    expect(
      screen.getByText('Très bien! Tes phrases sont claires.')
    ).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
