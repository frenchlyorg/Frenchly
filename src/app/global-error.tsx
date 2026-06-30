'use client'

// global-error.tsx replaces the root layout entirely — it must own <html> and <body>.
// Only fires in production builds (next build && next start), not in next dev.
import ErrorCard from '@/components/ui/ErrorCard'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ErrorCard
          heading="Something went wrong"
          body="We couldn't load this. Give it another try."
          action={{ label: 'Try again', onClick: reset }}
        />
      </body>
    </html>
  )
}
