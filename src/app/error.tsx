'use client'

import ErrorCard from '@/components/ui/ErrorCard'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorCard
      heading="Something went wrong"
      body="We couldn't load this. Give it another try."
      action={{ label: 'Try again', onClick: reset }}
    />
  )
}
