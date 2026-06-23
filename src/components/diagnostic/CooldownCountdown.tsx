'use client'

/**
 * CooldownCountdown — live per-minute countdown for the end-of-level retry cooldown.
 *
 * Display-only — the server re-checks isCooldownActive before allowing a retry, so
 * a tampered client clock cannot bypass the cooldown. Ticks every 60s (no seconds
 * shown per UI-SPEC); calls onExpire once the cooldown elapses so the parent can
 * re-enable the retry button.
 *
 * UI-SPEC refs: §Component Inventory — CooldownCountdown; §Accessibility (aria-live).
 */
import { useEffect, useState } from 'react'
import { formatCooldownRemaining, isCooldownActive } from '@/lib/diagnostics/gating'

interface CooldownCountdownProps {
  /** ISO timestamp when the cooldown ends. */
  cooldownUntil: string
  onExpire: () => void
}

export default function CooldownCountdown({ cooldownUntil, onExpire }: CooldownCountdownProps) {
  const until = new Date(cooldownUntil)
  const [remaining, setRemaining] = useState(() => formatCooldownRemaining(until))

  useEffect(() => {
    const id = setInterval(() => {
      if (!isCooldownActive(until)) {
        clearInterval(id)
        setRemaining('')
        onExpire()
      } else {
        setRemaining(formatCooldownRemaining(until))
      }
    }, 60_000)
    return () => clearInterval(id)
    // until is derived from the cooldownUntil prop; re-run only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldownUntil, onExpire])

  return (
    <span aria-live="polite" className="font-heading text-[28px] text-on-surface">
      {remaining}
    </span>
  )
}
