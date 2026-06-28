'use client'

/**
 * LinkButton — navigation control that shows a spinner while the route loads.
 *
 * Uses useTransition + router.push so the pending state stays true until the
 * destination Server Component is ready (then loading.tsx / the new page paints).
 * Drop-in for navigation CTAs that were plain <Link> buttons.
 */
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from './Spinner'

interface LinkButtonProps {
  href: string
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

export default function LinkButton({ href, children, className = '', ariaLabel }: LinkButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.push(href))}
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending}
      className={className}
    >
      {pending && <Spinner className="mr-2 align-[-0.125em]" />}
      {children}
    </button>
  )
}
