'use server'

/**
 * Lesson Server Actions — LESSON-03
 *
 * Security contract (T-03-09, T-03-10, T-03-11, T-03-12):
 *   - user_id ALWAYS derived server-side via getUser(); NEVER accepted from the client.
 *   - subComponentId validated as UUID via zod before any DB call.
 *   - sub-component existence verified before upsert (prevents phantom progress rows).
 *   - Upsert is idempotent on composite PK (user_id, sub_component_id).
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const SubComponentIdSchema = z.string().uuid()

export async function markSubComponentComplete(subComponentId: string): Promise<void> {
  // 1. Validate input first — before any DB call (T-03-11, V5 Input Validation)
  const parsed = SubComponentIdSchema.safeParse(subComponentId)
  if (!parsed.success) throw new Error('Invalid sub-component ID')

  // 2. Resolve user server-side — NEVER accept user_id from caller (T-03-09)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 3. Verify sub-component exists — prevent phantom progress rows (T-03-10)
  const { data: sc } = await supabase
    .from('sub_components')
    .select('id, lesson_id')
    .eq('id', parsed.data)
    .single()

  if (!sc) throw new Error('Sub-component not found')

  // 4. Fetch lesson + level slug for revalidatePath (route: /levels/[levelSlug]/lessons/[lessonId])
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, slug, level:levels ( slug )')
    .eq('id', sc.lesson_id)
    .single()

  // 5. Idempotent upsert on composite PK (T-03-12 — double-tap safe)
  const { error } = await supabase
    .from('sub_component_progress')
    .upsert(
      {
        user_id: user.id,
        sub_component_id: parsed.data,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,sub_component_id' }
    )

  if (error) throw new Error('Failed to save progress')

  // 6. Invalidate lesson page so Server Component re-fetches ground-truth progress
  //    Route shape: /levels/[levelSlug]/lessons/[lessonId] (Pitfall 2 guard)
  if (lesson) {
    // Supabase returns joined data as an array or object depending on the relation cardinality.
    // levels is a many-to-one join so the type can be array-like; normalise defensively.
    const levelData = lesson.level
    let levelSlug = ''
    if (Array.isArray(levelData) && levelData.length > 0) {
      levelSlug = (levelData[0] as { slug: string }).slug
    } else if (levelData && !Array.isArray(levelData)) {
      levelSlug = (levelData as unknown as { slug: string }).slug
    }
    revalidatePath(`/levels/${levelSlug}/lessons/${lesson.id}`)
  }
}
