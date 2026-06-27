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

-- ============================================================
-- Wave 2: Lessons 2–6 — complete French 1 curriculum content
-- ============================================================
--
-- What this block does:
--   Lesson 2 (definite-articles): UPDATE pos-2 sub-component to MC;
--     INSERT new fill-in (pos 4) and writing (pos 5); UPDATE lesson title + minutes.
--   Lessons 3–6: INSERT new lesson rows then INSERT 4 sub-components each.
--
-- Idempotency:
--   Lesson 2 UPDATEs are safe to re-run (overwrite same values).
--   Lesson 3–6 INSERTs are NOT idempotent — run the full file only once against
--   a given DB, or wrap the INSERTs in an existence guard if re-runs are needed.
--
-- Dollar-quoting: $json$...$json$ used for all content with apostrophes / double-quotes.

DO $$
DECLARE
  v_french1_id      uuid;
  v_articles_id     uuid;
  v_lesson3_id      uuid;
  v_lesson4_id      uuid;
  v_lesson5_id      uuid;
  v_lesson6_id      uuid;
BEGIN

  -- Resolve French 1 level ID
  SELECT id INTO v_french1_id
    FROM public.levels
   WHERE slug = 'french-1';

  -- Guard: abort if French 1 level not found
  IF v_french1_id IS NULL THEN
    RAISE EXCEPTION 'French 1 level not found — run Phase 3 migration first.';
  END IF;

  -- Resolve Lesson 2 (definite-articles) ID
  SELECT id INTO v_articles_id
    FROM public.lessons
   WHERE slug = 'definite-articles';

  IF v_articles_id IS NULL THEN
    RAISE NOTICE 'Phase 7 Wave 2: definite-articles lesson not found — skipping Lesson 2 updates.';
  ELSE

    -- ------------------------------------------------------------------
    -- Lesson 2 UPDATE: fix title to include l' and set estimated_minutes
    -- ------------------------------------------------------------------

    UPDATE public.lessons
       SET title             = $txt$Definite articles: le, la, l', les$txt$,
           estimated_minutes = 12
     WHERE slug = 'definite-articles';

    -- ------------------------------------------------------------------
    -- Lesson 2 UPDATE pos-2: set to MC problem (choose article for masculine noun)
    -- ------------------------------------------------------------------

    UPDATE public.sub_components
       SET problem_type = 'mc',
           content      = $json${"type":"mc","prompt":"Which definite article goes before 'livre' (book, masculine)?","options":["le","la","l'","les"],"correctAnswer":"le"}$json$
     WHERE title     = 'Practice: choose the right article'
       AND lesson_id = v_articles_id;

    -- ------------------------------------------------------------------
    -- Lesson 2 INSERT pos-4: fill-in (supply article for feminine noun)
    -- ------------------------------------------------------------------

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_articles_id,
      'Practice: fill in the article',
      'practice',
      'fill-in',
      $json${"type":"fill-in","prompt":"_____ table est grande. (The table is big.) Fill in the correct definite article.","correctAnswer":"La"}$json$,
      4
    );

    -- ------------------------------------------------------------------
    -- Lesson 2 INSERT pos-5: writing prompt
    -- ------------------------------------------------------------------

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_articles_id,
      'Write about objects around you',
      'writing',
      $json${"type":"written","prompt":"Write 2–3 sentences describing objects around you. Use le, la, l', or les for each noun.","hints":"Le livre est sur la table.\nLa fenêtre est grande.\nL'école est proche."}$json$,
      5
    );

  END IF;

  -- ====================================================================
  -- Lesson 3: Numbers and counting (NEW)
  -- ====================================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (
    v_french1_id,
    'numbers-and-counting',
    'Numbers and counting',
    12,
    3
  )
  RETURNING id INTO v_lesson3_id;

  -- pos 1: explainer
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson3_id,
    'French numbers 1–20',
    'explainer',
    $txt$## French numbers 1–20

Numbers in French follow predictable patterns. Pay attention to pronunciation — some numbers change sound before a vowel.

| Nombre | Français | Nombre | Français |
|--------|----------|--------|----------|
| 1 | un / une | 11 | onze |
| 2 | deux | 12 | douze |
| 3 | trois | 13 | treize |
| 4 | quatre | 14 | quatorze |
| 5 | cinq | 15 | quinze |
| 6 | six | 16 | seize |
| 7 | sept | 17 | dix-sept |
| 8 | huit | 18 | dix-huit |
| 9 | neuf | 19 | dix-neuf |
| 10 | dix | 20 | vingt |

**Tip:** Numbers like dix-sept (17), dix-huit (18), and dix-neuf (19) are combinations — literally "ten-seven," "ten-eight," "ten-nine."$txt$,
    1
  );

  -- pos 2: fill-in
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson3_id,
    'Practice: write the number',
    'practice',
    'fill-in',
    '{"type":"fill-in","prompt":"How do you write the number 7 in French?","correctAnswer":"sept"}',
    2
  );

  -- pos 3: matching
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson3_id,
    'Practice: match numbers to words',
    'practice',
    'matching',
    '{"type":"matching","prompt":"Match each numeral to its French word.","pairs":[{"left":"3","right":"trois"},{"left":"8","right":"huit"},{"left":"12","right":"douze"},{"left":"15","right":"quinze"},{"left":"20","right":"vingt"}]}',
    3
  );

  -- pos 4: writing
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson3_id,
    'Write about numbers',
    'writing',
    $json${"type":"written","prompt":"Write a few sentences about numbers in your daily life. Include at least three French numbers.","hints":"J'ai ___ ans.\nMon numéro de téléphone est...\nIl y a ___ élèves dans ma classe."}$json$,
    4
  );

  -- ====================================================================
  -- Lesson 4: Subject pronouns and être (NEW)
  -- ====================================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (
    v_french1_id,
    'pronouns-and-etre',
    'Subject pronouns and être',
    12,
    4
  )
  RETURNING id INTO v_lesson4_id;

  -- pos 1: explainer
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson4_id,
    'Subject pronouns and être',
    'explainer',
    $txt$## Subject pronouns and être

Every French sentence needs a subject pronoun paired with a verb. The verb être (to be) is essential for descriptions and introductions.

| Pronoun | Être (present) | Meaning |
|---------|---------------|---------|
| je | suis | I am |
| tu | es | you are (informal) |
| il / elle | est | he / she is |
| nous | sommes | we are |
| vous | êtes | you are (formal / plural) |
| ils / elles | sont | they are |

**Note:** Use **tu** with friends and peers; use **vous** with teachers, strangers, or a group.$txt$,
    1
  );

  -- pos 2: conjugation-table
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson4_id,
    'Practice: conjugate être',
    'practice',
    'conjugation-table',
    $json${"type":"conjugation-table","prompt":"Conjugate être (to be) in the present tense.","verb":"être","answers":{"je":"suis","tu":"es","il":"est","nous":"sommes","vous":"êtes","ils":"sont"}}$json$,
    2
  );

  -- pos 3: fill-in
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson4_id,
    'Practice: choose the pronoun',
    'practice',
    'fill-in',
    $json${"type":"fill-in","prompt":"_____ suis étudiant. (I am a student.) What is the correct subject pronoun?","correctAnswer":"Je"}$json$,
    3
  );

  -- pos 4: writing
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson4_id,
    'Introduce yourself with être',
    'writing',
    $json${"type":"written","prompt":"Write 3–4 sentences about yourself using être and subject pronouns. Describe who you are and where you are from.","hints":"Je suis étudiant(e).\nNous sommes en classe.\nIl est professeur."}$json$,
    4
  );

  -- ====================================================================
  -- Lesson 5: Indefinite articles: un, une, des (NEW)
  -- ====================================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (
    v_french1_id,
    'indefinite-articles',
    'Indefinite articles: un, une, des',
    12,
    5
  )
  RETURNING id INTO v_lesson5_id;

  -- pos 1: explainer
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson5_id,
    'Un, une, des',
    'explainer',
    $txt$## Un, une, des

Indefinite articles are like the English "a," "an," or "some." They refer to non-specific nouns.

| Article | Use | Example |
|---------|-----|---------|
| **un** | masculine singular | un stylo (a pen) |
| **une** | feminine singular | une table (a table) |
| **des** | all plural | des livres (some books) |

**Tip:** Unlike English, French uses **des** for plural indefinite nouns — where English often omits the article entirely ("I have books" = "J'ai des livres").$txt$,
    1
  );

  -- pos 2: MC
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson5_id,
    'Practice: choose the article',
    'practice',
    'mc',
    $json${"type":"mc","prompt":"Which indefinite article goes before 'crayon' (pencil, masculine)?","options":["un","une","des","le"],"correctAnswer":"un"}$json$,
    2
  );

  -- pos 3: fill-in
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson5_id,
    'Practice: complete the sentence',
    'practice',
    'fill-in',
    $json${"type":"fill-in","prompt":"_____ fille lit un livre. (A girl is reading a book.) Fill in the correct indefinite article.","correctAnswer":"Une"}$json$,
    3
  );

  -- pos 4: writing
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson5_id,
    'Describe your classroom',
    'writing',
    $json${"type":"written","prompt":"Write 3–4 sentences describing objects in your classroom. Use un, une, or des.","hints":"Il y a un tableau dans la salle.\nJ'ai une gomme et des crayons.\nIl y a des fenêtres et une porte."}$json$,
    4
  );

  -- ====================================================================
  -- Lesson 6: Être + adjectives — basic descriptions (NEW)
  -- ====================================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (
    v_french1_id,
    'etre-adjectives',
    'Être + adjectives: basic descriptions',
    12,
    6
  )
  RETURNING id INTO v_lesson6_id;

  -- pos 1: explainer
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson6_id,
    'Describing with être and adjectives',
    'explainer',
    $txt$## Describing with être and adjectives

In French, adjectives must agree in gender and number with the noun they describe. Use être to link the subject to its adjective.

| Form | Example |
|------|---------|
| grand (masc. sing.) | Le garçon est grand. |
| grande (fem. sing.) | La fille est grande. |
| grands (masc. pl.) | Les garçons sont grands. |
| grandes (fem. pl.) | Les filles sont grandes. |

**Important:** In French, adjectives usually come **after** the noun they describe (unlike English). When used with être they follow the verb directly.$txt$,
    1
  );

  -- pos 2: fill-in
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson6_id,
    'Practice: adjective agreement',
    'practice',
    'fill-in',
    $json${"type":"fill-in","prompt":"La maison est _____. (The house is big.) Use the correct form of 'grand'.","correctAnswer":"grande"}$json$,
    2
  );

  -- pos 3: conjugation-single
  INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
  VALUES (
    v_lesson6_id,
    'Practice: conjugate être',
    'practice',
    'conjugation-single',
    $json${"type":"conjugation-single","prompt":"Elles _____ (être) intelligentes. Fill in the correct form.","correctAnswer":"sont"}$json$,
    3
  );

  -- pos 4: writing
  INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
  VALUES (
    v_lesson6_id,
    'Describe yourself and a friend',
    'writing',
    $json${"type":"written","prompt":"Write 3–4 sentences describing yourself and a friend using être and adjectives. Remember to match the adjective to the gender of the subject.","hints":"Je suis grand(e) et intelligent(e).\nMon ami est sympa.\nNous sommes étudiants sérieux."}$json$,
    4
  );

END;
$$;
