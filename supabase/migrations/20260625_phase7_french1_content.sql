-- Phase 7: French 1 Content — Lesson 1 (Greetings and Introductions)
--
-- What this file does:
--   Updates two NULL content columns on the Greetings lesson that were seeded
--   with placeholder rows in Phase 3 (sub_components at positions 2 and 3).
--
--   Wave 1 (this file, 07-01-PLAN.md): Lesson 1 — Greetings and Introductions only.
--   Wave 2 (07-02-PLAN.md): Lessons 2–6 will be appended below.
--
-- Safe to re-run:
--   All statements are UPDATE ... WHERE title = '...' AND lesson_id = (...).
--   Re-running overwrites content with the same values — no duplicate rows created.
--   UPDATE on a non-existent row is a no-op; the RAISE NOTICE guard below will
--   report if the lesson slug cannot be resolved.
--
-- Threat mitigations (T-07-01):
--   - Dollar-quoting ($$ or $json$) used for all string literals containing
--     apostrophes, double-quotes, or French special characters.
--   - WHERE clause uses both title and lesson_id to scope each UPDATE precisely.

DO $$
DECLARE
  v_greetings_id uuid;
BEGIN

  -- Resolve Lesson 1 ID by slug
  SELECT id INTO v_greetings_id
    FROM public.lessons
   WHERE slug = 'greetings';

  -- Guard: skip if lesson not found (e.g., migration run before Phase 3 seed)
  IF v_greetings_id IS NULL THEN
    RAISE NOTICE 'Phase 7 seed skipped: greetings lesson not found (slug=greetings). Run Phase 3 migration first.';
    RETURN;
  END IF;

  -- -----------------------------------------------------------------------
  -- Sub-component: 'Practice: match the greeting'  (position=2, kind=practice)
  -- Sets problem_type='matching' and content to a MatchingProblem JSON.
  -- 4 pairs map each French greeting to its English meaning / usage context.
  -- -----------------------------------------------------------------------

  UPDATE public.sub_components
     SET problem_type = 'matching',
         content      = $json${"type":"matching","prompt":"Match each French greeting to its meaning.","pairs":[{"left":"Bonjour","right":"Hello / Good morning"},{"left":"Salut","right":"Hi (informal)"},{"left":"Bonsoir","right":"Good evening"},{"left":"Bonne nuit","right":"Good night"}]}$json$
   WHERE title     = 'Practice: match the greeting'
     AND lesson_id = v_greetings_id;

  -- -----------------------------------------------------------------------
  -- Sub-component: 'Write your own introduction'  (position=3, kind=writing)
  -- Sets content to a WrittenProblem JSON.
  -- problem_type stays NULL (kind='writing' does not use problem_type).
  -- hints: 3 newline-separated French phrases rendered with whitespace-pre-line.
  -- -----------------------------------------------------------------------

  UPDATE public.sub_components
     SET content = $json${"type":"written","prompt":"Write a short introduction of yourself in French. Include your name and a greeting appropriate for meeting someone new.","hints":"Je m'appelle [prénom].\nBonjour, je suis étudiant(e).\nEnchanté(e) de vous rencontrer."}$json$
   WHERE title     = 'Write your own introduction'
     AND lesson_id = v_greetings_id;

END;
$$;

-- Wave 2 content (Lessons 2-6) appended by 07-02-PLAN.md
