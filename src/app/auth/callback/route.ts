// Password-reset code exchange route handler — D-04, T-02-18
// Exchanges the one-time code Supabase embeds in the reset link for a session,
// then redirects the user to the update-password page.
// Invalid or missing codes redirect to /login?error=invalid-reset-link (T-02-18)

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/update-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Missing or invalid code — redirect without revealing why (T-02-18)
  return NextResponse.redirect(`${origin}/login?error=invalid-reset-link`)
}
