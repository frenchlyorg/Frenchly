'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Filter } from 'bad-words'

// Module-level profanity filter — bypass list covers leetspeak variants (D-05)
const filter = new Filter()
filter.addWords(
  'nigha',
  'sh1tter',
  'b1tch',
  'b1tch',
  'sh!tter',
  'n1gha',
  'n1gger',
  'n1gga',
  'f4ggot',
  'f@ggot',
)

// ────────────────────────────────────────────────────────────────────────────
// Private rate-limit helpers (use admin client — login_attempts is service-role only)
// ────────────────────────────────────────────────────────────────────────────

async function checkRateLimit(email: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient()
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('attempted_at', fifteenMinutesAgo)

  return (count ?? 0) >= 5
}

async function recordFailedAttempt(email: string, ip: string): Promise<void> {
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.from('login_attempts').insert({ email, ip_address: ip })
}

// ────────────────────────────────────────────────────────────────────────────
// signUp — AUTH-01, SEC-01
// ────────────────────────────────────────────────────────────────────────────

export async function signUp(
  formData: FormData
): Promise<{ error: 'email' | 'username' | 'password' | 'general'; message: string } | void> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const username = (formData.get('username') as string | null)?.trim() ?? ''

  // 1. Validate username format (D-05)
  const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernamePattern.test(username)) {
    return {
      error: 'username',
      message: 'Username must be 3–20 characters: letters, numbers, underscores only.',
    }
  }

  // 2. Profanity check (D-05)
  if (filter.isProfane(username)) {
    return {
      error: 'username',
      message: "That username isn't available. Try something else.",
    }
  }

  // 3. Password strength (D-03): at least 12 chars + at least one digit
  if (password.length < 12 || !/\d/.test(password)) {
    return {
      error: 'password',
      message: 'Make it at least 12 characters with a number — your account will thank you.',
    }
  }

  // 4. Pre-check username uniqueness for friendly error (Pitfall 4 — DB constraint is authoritative)
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return {
      error: 'username',
      message: 'That username is gone — try adding your initial or a number.',
    }
  }

  // 5. Create auth user — username goes in options.data; handle_new_user trigger writes profiles row
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) {
    // Email already registered (D-12)
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('email already in use') ||
      error.message.toLowerCase().includes('user already registered')
    ) {
      return {
        error: 'email',
        message: "Hmm, that email's taken — already a Frenchly member?",
      }
    }

    // DB unique constraint violation from the trigger (Pitfall 4: race condition)
    if (error.message.includes('23505') || error.message.toLowerCase().includes('unique')) {
      return {
        error: 'username',
        message: 'That username is gone — try adding your initial or a number.',
      }
    }

    return {
      error: 'general',
      message: 'Something went wrong. Please try again.',
    }
  }

  // Success — redirect throws internally; do NOT wrap in try/catch
  redirect('/dashboard')
}

// ────────────────────────────────────────────────────────────────────────────
// signIn — AUTH-02, SEC-01, SEC-04
// ────────────────────────────────────────────────────────────────────────────

export async function signIn(
  formData: FormData
): Promise<{ error: 'general'; message: string } | void> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // 1. Rate limit check BEFORE the auth call (SEC-04, D-19, Pitfall 7 — no enumeration)
  const isLocked = await checkRateLimit(email)
  if (isLocked) {
    return {
      error: 'general',
      message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    }
  }

  // 2. Attempt login
  const supabase = await createClient()
  const authResult = await supabase.auth.signInWithPassword({ email, password })
  const { data, error } = authResult ?? { data: null, error: { message: 'Unknown error' } }

  if (error) {
    // Record failed attempt (SEC-04)
    await recordFailedAttempt(email, ip)
    // Vague error — no detail about whether email or password was wrong (D-13, T-02-07)
    return {
      error: 'general',
      message: 'Email or password incorrect.',
    }
  }

  // 3. Role-based redirect (D-07, D-16) — role read server-side from profiles (never user_metadata)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin')
  }
  redirect('/dashboard')
}

// ────────────────────────────────────────────────────────────────────────────
// signOut — AUTH-03, D-08
// ────────────────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ────────────────────────────────────────────────────────────────────────────
// resetPassword — D-04 — always returns same message (no email enumeration, T-02-16)
// ────────────────────────────────────────────────────────────────────────────

export async function resetPassword(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectTo = `${siteUrl}/auth/callback?next=/account/update-password`

  const supabase = await createClient()
  // Fire-and-forget — never reveal whether the email is registered (T-02-16)
  await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  return {
    success: true,
    message: "If that email is registered, you'll receive a reset link.",
  }
}

// ────────────────────────────────────────────────────────────────────────────
// deleteAccount — AUTH-04, D-14, D-15
// Resolves user server-side via getUser — never accepts a client-supplied id (T-02-15)
// PII anonymization + soft-delete MUST use admin client (column grant is service_role only)
// ────────────────────────────────────────────────────────────────────────────

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient()

  // Resolve the authenticated user id server-side (T-02-15 — never trust client input)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = user.id
  const supabaseAdmin = createAdminClient()

  // 1. Anonymize PII in profiles (service_role required — column grant blocks user context)
  await supabaseAdmin
    .from('profiles')
    .update({
      username: 'deleted_' + id.slice(0, 8),
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  // 2. Soft-delete the auth user — marks auth.users.deleted_at so login is rejected (Pitfall 6 / T-02-17)
  await supabaseAdmin.auth.admin.deleteUser(id, true)

  // 3. Clear the session cookie then return to home
  await supabase.auth.signOut()
  redirect('/')
}
