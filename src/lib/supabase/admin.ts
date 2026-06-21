// NEVER import this module from client components — SUPABASE_SECRET_KEY is server-only
import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
