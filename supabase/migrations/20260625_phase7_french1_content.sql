-- Phase 7: French 1 Content — Lessons 1–6
--
-- What this file does:
--   Lesson 1 (greetings): UPDATE 2 NULL sub-component content columns (Wave 1, 07-01-PLAN.md)
--   Lesson 2 (definite-articles): UPDATE pos-2 to MC; INSERT pos-4 fill-in, pos-5 writing
--   Lessons 3–6: INSERT new lesson rows + 4 sub-components each (Wave 2, 07-02-PLAN.md)
--
-- Safe to re-run:
--   Lesson 1–2 UPDATEs are idempotent (overwrite same values on re-run).
--   Lesson 3–6 INSERTs skip silently if the lesson slug already exists (ON CONFLICT DO NOTHING).
--   Sub-component INSERTs for new lessons use the lesson_id from RETURNING, so they only
--   run when the lesson INSERT succeeds — idempotent by design.
--
-- Dollar-quoting strategy:
--   Outer block:   $body$...$body$  (avoids any $$ parsing ambiguity)
--   JSON content:  $json$...$json$
--   Markdown text: $txt$...$txt$
--   No bare single-quoted strings for content with apostrophes or special characters.

DO $body$
DECLARE
  v_french1_id   uuid;
  v_greetings_id uuid;
  v_articles_id  uuid;
  v_lesson3_id   uuid;
  v_lesson4_id   uuid;
  v_lesson5_id   uuid;
  v_lesson6_id   uuid;
BEGIN

  -- ============================================================
  -- Guard: French 1 level must exist (Phase 3 prerequisite)
  -- ============================================================

  SELECT id INTO v_french1_id
    FROM public.levels
   WHERE slug = 'french-1';

  IF v_french1_id IS NULL THEN
    RAISE EXCEPTION 'French 1 level not found — run Phase 3 migration first.';
  END IF;

  -- ============================================================
  -- Lesson 1: Greetings and Introductions (Wave 1, 07-01-PLAN.md)
  -- UPDATE 2 sub-components that were seeded NULL in Phase 3.
  -- ============================================================

  SELECT id INTO v_greetings_id
    FROM public.lessons
   WHERE slug = 'greetings';

  IF v_greetings_id IS NULL THEN
    RAISE NOTICE 'Phase 7: greetings lesson not found — skipping Lesson 1 updates.';
  ELSE

    -- pos 2: matching practice
    UPDATE public.sub_components
       SET problem_type = 'matching',
           content      = $json${"type":"matching","prompt":"Match each French greeting to its meaning.","pairs":[{"left":"Bonjour","right":"Hello / Good morning"},{"left":"Salut","right":"Hi (informal)"},{"left":"Bonsoir","right":"Good evening"},{"left":"Bonne nuit","right":"Good night"}]}$json$
     WHERE title     = 'Practice: match the greeting'
       AND lesson_id = v_greetings_id;

    -- pos 3: writing prompt
    UPDATE public.sub_components
       SET content = $json${"type":"written","prompt":"Write a short introduction of yourself in French. Include your name and a greeting appropriate for meeting someone new.","hints":"Je m'appelle [prénom].\nBonjour, je suis étudiant(e).\nEnchanté(e) de vous rencontrer."}$json$
     WHERE title     = 'Write your own introduction'
       AND lesson_id = v_greetings_id;

  END IF;

  -- ============================================================
  -- Lesson 2: Definite articles (Wave 2, 07-02-PLAN.md)
  -- UPDATE existing rows + INSERT 2 new sub-components.
  -- ============================================================

  SELECT id INTO v_articles_id
    FROM public.lessons
   WHERE slug = 'definite-articles';

  IF v_articles_id IS NULL THEN
    RAISE NOTICE 'Phase 7: definite-articles lesson not found — skipping Lesson 2 updates.';
  ELSE

    UPDATE public.lessons
       SET title             = $txt$Definite articles: le, la, l', les$txt$,
           estimated_minutes = 12
     WHERE slug = 'definite-articles';

    -- pos 2: UPDATE to MC (was NULL kind=practice from Phase 3)
    UPDATE public.sub_components
       SET problem_type = 'mc',
           content      = $json${"type":"mc","prompt":"Which definite article goes before 'livre' (book, masculine)?","options":["le","la","l'","les"],"correctAnswer":"le"}$json$
     WHERE title     = 'Practice: choose the right article'
       AND lesson_id = v_articles_id;

    -- pos 4: fill-in (new)
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_articles_id,
      'Practice: fill in the article',
      'practice',
      'fill-in',
      $json${"type":"fill-in","prompt":"_____ table est grande. (The table is big.) Fill in the correct definite article.","correctAnswer":"La"}$json$,
      4
    );

    -- pos 5: writing (new)
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_articles_id,
      'Write about objects around you',
      'writing',
      $json${"type":"written","prompt":"Write 2-3 sentences describing objects around you. Use le, la, l', or les for each noun.","hints":"Le livre est sur la table.\nLa fenetre est grande.\nL'ecole est proche."}$json$,
      5
    );

  END IF;

  -- ============================================================
  -- Lesson 3: Numbers and counting (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french1_id, 'numbers-and-counting', 'Numbers and counting', 12, 3)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson3_id;

  IF v_lesson3_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson3_id, 'French numbers 1-20', 'explainer',
      $txt$## French numbers 1-20

Numbers in French follow predictable patterns. Pay attention to pronunciation.

| Nombre | Francais | Nombre | Francais |
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

**Tip:** Numbers 17-19 are combinations: dix-sept = ten-seven, dix-huit = ten-eight, dix-neuf = ten-nine.$txt$,
      1
    );

    -- pos 2: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson3_id, 'Practice: write the number', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"How do you write the number 7 in French?","correctAnswer":"sept"}$json$,
      2
    );

    -- pos 3: matching
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson3_id, 'Practice: match numbers to words', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each numeral to its French word.","pairs":[{"left":"3","right":"trois"},{"left":"8","right":"huit"},{"left":"12","right":"douze"},{"left":"15","right":"quinze"},{"left":"20","right":"vingt"}]}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson3_id, 'Write about numbers', 'writing',
      $json${"type":"written","prompt":"Write a few sentences about numbers in your daily life. Include at least three French numbers.","hints":"J'ai ___ ans.\nMon numero de telephone est...\nIl y a ___ eleves dans ma classe."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 4: Subject pronouns and etre (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french1_id, 'pronouns-and-etre', 'Subject pronouns and etre', 12, 4)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson4_id;

  IF v_lesson4_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson4_id, 'Subject pronouns and etre', 'explainer',
      $txt$## Subject pronouns and etre

Every French sentence needs a subject pronoun. The verb etre (to be) is essential for introductions and descriptions.

| Pronoun | Etre (present) | Meaning |
|---------|---------------|---------|
| je | suis | I am |
| tu | es | you are (informal) |
| il / elle | est | he / she is |
| nous | sommes | we are |
| vous | etes | you are (formal / plural) |
| ils / elles | sont | they are |

**Note:** Use tu with friends and peers; use vous with teachers, strangers, or a group.$txt$,
      1
    );

    -- pos 2: conjugation-table
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson4_id, 'Practice: conjugate etre', 'practice', 'conjugation-table',
      $json${"type":"conjugation-table","prompt":"Conjugate etre (to be) in the present tense.","verb":"etre","answers":{"je":"suis","tu":"es","il":"est","nous":"sommes","vous":"etes","ils":"sont"}}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson4_id, 'Practice: choose the pronoun', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"_____ suis etudiant. (I am a student.) What is the correct subject pronoun?","correctAnswer":"Je"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson4_id, 'Introduce yourself with etre', 'writing',
      $json${"type":"written","prompt":"Write 3-4 sentences about yourself using etre and subject pronouns. Describe who you are and where you are from.","hints":"Je suis etudiant(e).\nNous sommes en classe.\nIl est professeur."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 5: Indefinite articles (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french1_id, 'indefinite-articles', 'Indefinite articles: un, une, des', 12, 5)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson5_id;

  IF v_lesson5_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson5_id, 'Un, une, des', 'explainer',
      $txt$## Un, une, des

Indefinite articles work like the English "a," "an," or "some." They refer to non-specific nouns.

| Article | Use | Example |
|---------|-----|---------|
| un | masculine singular | un stylo (a pen) |
| une | feminine singular | une table (a table) |
| des | all plural | des livres (some books) |

**Tip:** French uses des for plural indefinite nouns where English often drops the article. "I have books" = "J'ai des livres."$txt$,
      1
    );

    -- pos 2: MC
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson5_id, 'Practice: choose the article', 'practice', 'mc',
      $json${"type":"mc","prompt":"Which indefinite article goes before 'crayon' (pencil, masculine)?","options":["un","une","des","le"],"correctAnswer":"un"}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson5_id, 'Practice: complete the sentence', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"_____ fille lit un livre. (A girl is reading a book.) Fill in the correct indefinite article.","correctAnswer":"Une"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson5_id, 'Describe your classroom', 'writing',
      $json${"type":"written","prompt":"Write 3-4 sentences describing objects in your classroom. Use un, une, or des.","hints":"Il y a un tableau dans la salle.\nJ'ai une gomme et des crayons.\nIl y a des fenetres et une porte."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 6: Etre + adjectives (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french1_id, 'etre-adjectives', 'Etre + adjectives: basic descriptions', 12, 6)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson6_id;

  IF v_lesson6_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson6_id, 'Describing with etre and adjectives', 'explainer',
      $txt$## Describing with etre and adjectives

Adjectives must agree in gender and number with the noun they describe.

| Form | Example |
|------|---------|
| grand (masc. sing.) | Le garcon est grand. |
| grande (fem. sing.) | La fille est grande. |
| grands (masc. pl.) | Les garcons sont grands. |
| grandes (fem. pl.) | Les filles sont grandes. |

**Important:** In French, adjectives usually come after the noun. With etre they follow the verb directly.$txt$,
      1
    );

    -- pos 2: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson6_id, 'Practice: adjective agreement', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"La maison est _____. (The house is big.) Use the correct form of 'grand'.","correctAnswer":"grande"}$json$,
      2
    );

    -- pos 3: conjugation-single
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson6_id, 'Practice: conjugate etre', 'practice', 'conjugation-single',
      $json${"type":"conjugation-single","prompt":"Elles _____ (etre) intelligentes. Fill in the correct form.","correctAnswer":"sont"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson6_id, 'Describe yourself and a friend', 'writing',
      $json${"type":"written","prompt":"Write 3-4 sentences describing yourself and a friend using etre and adjectives. Remember to match the adjective to the gender of the subject.","hints":"Je suis grand(e) et intelligent(e).\nMon ami est sympa.\nNous sommes etudiants serieux."}$json$,
      4
    );

  END IF;

END;
$body$;
