/**
 * Spinner — inline loading wheel for action buttons.
 *
 * Inherits color via `currentColor` so it matches the button text it sits in.
 * Sized in em so it scales with the button's font-size. Respects reduced motion.
 *
 * Used by: auth form submit buttons, LinkButton navigation CTAs.
 */
export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`inline-block h-[1em] w-[1em] animate-spin motion-reduce:animate-none ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  )
}
