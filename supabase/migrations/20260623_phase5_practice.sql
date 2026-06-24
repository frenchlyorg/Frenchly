-- Phase 5: Practice Problem Engine — DB migration
-- Adds problem_type discriminant column to sub_components.
-- Seeds 10 practice rows (2 per type) for development.
--
-- DO NOT apply via supabase db push in this plan — Plan 04 applies with live push checkpoint.

-- ---------------------------------------------------------------------------
-- 1. Schema: Add problem_type column with check constraint
-- ---------------------------------------------------------------------------

ALTER TABLE public.sub_components
  ADD COLUMN IF NOT EXISTS problem_type text
    CONSTRAINT sub_component_problem_type CHECK (
      problem_type IS NULL OR
      problem_type IN ('mc', 'fill-in', 'conjugation-table', 'conjugation-single', 'matching')
    );

-- ---------------------------------------------------------------------------
-- 2. Documentation
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN public.sub_components.problem_type IS
  'Discriminant for practice sub-components. NULL for explainer and writing kinds. '
  'Must match the "type" field in the content JSON when kind=''practice''. '
  'Check constraint enforces the allowed type set at INSERT/UPDATE time.';

-- ---------------------------------------------------------------------------
-- 3. Seed: 10 practice rows (2 per type), positions 10–19 to avoid collision
--    Resolves lesson IDs by slug — greetings and definite-articles from Phase 3 seed.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_greetings_id uuid;
  v_articles_id  uuid;
BEGIN
  SELECT id INTO v_greetings_id
    FROM public.lessons
   WHERE slug = 'greetings';

  SELECT id INTO v_articles_id
    FROM public.lessons
   WHERE slug = 'definite-articles';

  -- Guard: skip seed if lessons don't exist (e.g., fresh DB without Phase 3 seed)
  IF v_greetings_id IS NULL OR v_articles_id IS NULL THEN
    RAISE NOTICE 'Phase 5 seed skipped: greetings or definite-articles lesson not found.';
    RETURN;
  END IF;

  -- ----------------------------------------------------------------
  -- MC (2 rows) — positions 10, 11
  -- ----------------------------------------------------------------

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_greetings_id,
    'Practice: formal vs informal greeting',
    'practice',
    'mc',
    '{"type":"mc","prompt":"Which greeting is appropriate for a teacher?","options":["Salut","Bonjour","Coucou","Hé"],"correctAnswer":"Bonjour"}',
    10
  );

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_greetings_id,
    'Practice: choose the farewell',
    'practice',
    'mc',
    '{"type":"mc","prompt":"Which phrase means \"goodbye\" in French?","options":["Bonjour","Au revoir","Merci","S''il vous plaît"],"correctAnswer":"Au revoir"}',
    11
  );

  -- ----------------------------------------------------------------
  -- Fill-in (2 rows) — positions 12, 13
  -- ----------------------------------------------------------------

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_greetings_id,
    'Practice: good evening',
    'practice',
    'fill-in',
    '{"type":"fill-in","prompt":"How do you say \"good evening\" in French?","correctAnswer":"Bonsoir"}',
    12
  );

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_greetings_id,
    'Practice: good morning',
    'practice',
    'fill-in',
    '{"type":"fill-in","prompt":"How do you say \"good morning\" in French?","correctAnswer":"Bonjour"}',
    13
  );

  -- ----------------------------------------------------------------
  -- Conjugation-table (2 rows) — positions 14, 15
  -- ----------------------------------------------------------------

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_articles_id,
    'Practice: conjugate parler',
    'practice',
    'conjugation-table',
    '{"type":"conjugation-table","prompt":"Conjugate parler (to speak) in the present tense.","verb":"parler","answers":{"je":"parle","tu":"parles","il":"parle","nous":"parlons","vous":"parlez","ils":"parlent"}}',
    14
  );

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_articles_id,
    'Practice: conjugate aimer',
    'practice',
    'conjugation-table',
    '{"type":"conjugation-table","prompt":"Conjugate aimer (to like/love) in the present tense.","verb":"aimer","answers":{"je":"aime","tu":"aimes","il":"aime","nous":"aimons","vous":"aimez","ils":"aiment"}}',
    15
  );

  -- ----------------------------------------------------------------
  -- Conjugation-single (2 rows) — positions 16, 17
  -- ----------------------------------------------------------------

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_greetings_id,
    'Practice: je parle',
    'practice',
    'conjugation-single',
    '{"type":"conjugation-single","prompt":"Je ___ (parler). Fill in the correct form.","correctAnswer":"parle"}',
    16
  );

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_greetings_id,
    'Practice: nous parlons',
    'practice',
    'conjugation-single',
    '{"type":"conjugation-single","prompt":"Nous ___ (parler). Fill in the correct form.","correctAnswer":"parlons"}',
    17
  );

  -- ----------------------------------------------------------------
  -- Matching (2 rows) — positions 18, 19
  -- ----------------------------------------------------------------

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_articles_id,
    'Practice: match the definite article',
    'practice',
    'matching',
    '{"type":"matching","prompt":"Match each noun to its correct definite article.","pairs":[{"left":"le livre","right":"masculine singular"},{"left":"la table","right":"feminine singular"},{"left":"les amis","right":"plural"},{"left":"l''école","right":"vowel/h"}]}',
    18
  );

  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_articles_id,
    'Practice: match the greeting to its register',
    'practice',
    'matching',
    '{"type":"matching","prompt":"Match each French greeting to its register (formal or informal).","pairs":[{"left":"Bonjour","right":"formal"},{"left":"Salut","right":"informal"},{"left":"Bonsoir","right":"formal (evening)"},{"left":"Coucou","right":"very informal"}]}',
    19
  );

END;
$$;
