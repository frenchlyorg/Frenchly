-- Phase 8: French 2 Content — All 10 Lessons
--
-- What this file does:
--   Seeds all 10 French 2 lessons with real grammar content.
--   Each lesson has 4 sub-components: 1 explainer + 2 practice problems + 1 writing prompt.
--   French 2 level row already exists in DB (slug: french-2, id: 97600976-de70-45af-ab50-4aedd2852f3a).
--   All lessons are fresh INSERTs — French 2 had 0 seeded lessons before this migration.
--
-- Safe to re-run (idempotent):
--   Lesson INSERTs use ON CONFLICT (level_id, slug) DO NOTHING RETURNING id.
--   Sub-component INSERTs are inside IF v_lessonN_id IS NOT NULL THEN guards —
--   they only run when the lesson INSERT succeeds (i.e., first run only).
--
-- Dollar-quoting strategy:
--   Outer block:   $body$...$body$  (avoids any $$ parsing ambiguity)
--   JSON content:  $json$...$json$
--   Markdown text: $txt$...$txt$
--   No bare single-quoted strings for content with apostrophes or special characters.

DO $body$
DECLARE
  v_french2_id  uuid;
  v_lesson1_id  uuid;
  v_lesson2_id  uuid;
  v_lesson3_id  uuid;
  v_lesson4_id  uuid;
  v_lesson5_id  uuid;
  v_lesson6_id  uuid;
  v_lesson7_id  uuid;
  v_lesson8_id  uuid;
  v_lesson9_id  uuid;
  v_lesson10_id uuid;
BEGIN

  -- ============================================================
  -- Guard: French 2 level must exist (Phase 3 prerequisite)
  -- ============================================================

  SELECT id INTO v_french2_id
    FROM public.levels
   WHERE slug = 'french-2';

  IF v_french2_id IS NULL THEN
    RAISE EXCEPTION 'French 2 level not found — run Phase 3 migration first.';
  END IF;

  -- ============================================================
  -- Lesson 1: Regular -ER verbs (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'er-verbs', 'Regular -ER verbs', 12, 1)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson1_id;

  IF v_lesson1_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson1_id, 'How to conjugate -ER verbs', 'explainer',
      $txt$## How to conjugate -ER verbs

Regular -ER verbs are the most common verb group in French. Remove the -ER ending and add the correct suffix.

**Example verb: parler (to speak)**

| Pronom | Terminaison | Forme |
|--------|-------------|-------|
| je | -e | parle |
| tu | -es | parles |
| il / elle | -e | parle |
| nous | -ons | parlons |
| vous | -ez | parlez |
| ils / elles | -ent | parlent |

**Other common -ER verbs:** manger (to eat), étudier (to study), écouter (to listen), travailler (to work), habiter (to live/reside).

**Tip:** The je, il, and ils forms sound identical for most -ER verbs — context clarifies the subject.$txt$,
      1
    );

    -- pos 2: conjugation-table
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson1_id, 'Practice: conjugate parler', 'practice', 'conjugation-table',
      $json${"type":"conjugation-table","prompt":"Conjugate parler (to speak) in the present tense.","verb":"parler","answers":{"je":"parle","tu":"parles","il":"parle","nous":"parlons","vous":"parlez","ils":"parlent"}}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson1_id, 'Practice: complete the sentence', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Nous _____ (étudier) le français tous les jours. Fill in the correct form.","correctAnswer":"étudions"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson1_id, 'Write about your daily routine', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences describing your daily routine using -ER verbs. Include at least three different verbs.","hints":"Je mange le petit-déjeuner à sept heures.\nNous étudions le français en classe.\nJ'écoute de la musique après l'école."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 2: Regular -IR verbs (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'ir-verbs', 'Regular -IR verbs', 12, 2)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson2_id;

  IF v_lesson2_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson2_id, 'How to conjugate -IR verbs', 'explainer',
      $txt$## How to conjugate -IR verbs

Regular -IR verbs form their own group. Remove -IR and add the correct suffix. Notice the -iss- that appears in the nous, vous, and ils forms.

**Example verb: finir (to finish)**

| Pronom | Terminaison | Forme |
|--------|-------------|-------|
| je | -is | finis |
| tu | -is | finis |
| il / elle | -it | finit |
| nous | -issons | finissons |
| vous | -issez | finissez |
| ils / elles | -issent | finissent |

**Other common -IR verbs:** choisir (to choose), réussir (to succeed), obéir (to obey), rougir (to blush), grandir (to grow).

**Tip:** The -iss- infix in plural forms is the key marker that distinguishes -IR verbs from irregular ir-verbs like partir or dormir.$txt$,
      1
    );

    -- pos 2: conjugation-table
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson2_id, 'Practice: conjugate finir', 'practice', 'conjugation-table',
      $json${"type":"conjugation-table","prompt":"Conjugate finir (to finish) in the present tense.","verb":"finir","answers":{"je":"finis","tu":"finis","il":"finit","nous":"finissons","vous":"finissez","ils":"finissent"}}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson2_id, 'Practice: complete the sentence', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Est-ce que tu _____ (réussir) à tes examens? Fill in the correct form.","correctAnswer":"réussis"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson2_id, 'Write about choices and goals', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences about things you choose to do or want to finish. Use -IR verbs.","hints":"Je choisis mes cours avec soin.\nNous finissons nos devoirs avant le dîner.\nElle réussit toujours à ses examens."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 3: Regular -RE verbs (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 're-verbs', 'Regular -RE verbs', 12, 3)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson3_id;

  IF v_lesson3_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson3_id, 'How to conjugate -RE verbs', 'explainer',
      $txt$## How to conjugate -RE verbs

Regular -RE verbs are the third verb group. Remove -RE and add the correct ending. Note that the il/elle form has no ending added (the stem stands alone).

**Example verb: vendre (to sell)**

| Pronom | Terminaison | Forme |
|--------|-------------|-------|
| je | -s | vends |
| tu | -s | vends |
| il / elle | — (aucune) | vend |
| nous | -ons | vendons |
| vous | -ez | vendez |
| ils / elles | -ent | vendent |

**Other common -RE verbs:** attendre (to wait), répondre (to answer/respond), entendre (to hear), perdre (to lose), descendre (to go down).

**Tip:** The il/elle form drops the -RE but adds no new ending — making it unique among the three regular verb groups.$txt$,
      1
    );

    -- pos 2: conjugation-table
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson3_id, 'Practice: conjugate vendre', 'practice', 'conjugation-table',
      $json${"type":"conjugation-table","prompt":"Conjugate vendre (to sell) in the present tense.","verb":"vendre","answers":{"je":"vends","tu":"vends","il":"vend","nous":"vendons","vous":"vendez","ils":"vendent"}}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson3_id, 'Practice: complete the sentence', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Nous _____ (attendre) le bus depuis dix minutes. Fill in the correct form.","correctAnswer":"attendons"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson3_id, 'Write about waiting and responding', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences using -RE verbs. Describe a situation where you wait, respond, or hear something.","hints":"J'attends mes amis devant le cinéma.\nElle répond aux questions du professeur.\nNous entendons la musique de la rue."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 4: Negation: ne...pas (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'negation', 'Negation: ne...pas', 12, 4)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson4_id;

  IF v_lesson4_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson4_id, 'Making sentences negative', 'explainer',
      $txt$## Making sentences negative

In French, negation wraps around the conjugated verb with two parts: **ne** before the verb and **pas** (or another negative word) after it.

**Basic negation: ne...pas (not)**

| Affirmative | Négatif |
|-------------|---------|
| Je parle français. | Je ne parle pas français. |
| Elle mange une pomme. | Elle ne mange pas de pomme. |

**Other negation patterns:**

| Expression | Meaning | Example |
|------------|---------|---------|
| ne...jamais | never | Je ne mange jamais de viande. |
| ne...plus | no longer / not anymore | Il ne travaille plus ici. |
| ne...rien | nothing | Je ne vois rien. |
| ne...personne | nobody | Elle ne connaît personne. |

**Tip:** Before a vowel, ne contracts to n': Je n'aime pas les épinards.$txt$,
      1
    );

    -- pos 2: MC
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson4_id, 'Practice: identify correct negation', 'practice', 'mc',
      $json${"type":"mc","prompt":"Which sentence uses ne...pas correctly?","options":["Je parle ne pas français.","Je ne parle pas français.","Je ne pas parle français.","Ne je parle pas français."],"correctAnswer":"Je ne parle pas français."}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson4_id, 'Practice: add negation', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Il _____ regarde _____ la télévision. (He does not watch TV.) Fill in the two parts of the negation separated by a space.","correctAnswer":"ne regarde pas"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson4_id, 'Write about what you do not do', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences about things you do not do, no longer do, or never do. Use ne...pas, ne...jamais, and ne...plus.","hints":"Je ne mange jamais de fast-food.\nElle ne travaille plus le week-end.\nNous ne regardons pas la télévision le matin."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 5: Question formation (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'questions', 'Question formation', 12, 5)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson5_id;

  IF v_lesson5_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson5_id, 'Three ways to ask a yes/no question', 'explainer',
      $txt$## Three ways to ask a yes/no question

French has three main strategies for forming yes/no questions, ranging from informal to formal.

| Stratégie | Exemple | Registre |
|-----------|---------|---------|
| Intonation montante | Tu parles français? | Informel |
| Est-ce que... | Est-ce que tu parles français? | Neutre |
| Inversion | Parles-tu français? | Formel |

**How inversion works:**
- Swap the subject pronoun and the verb, and connect them with a hyphen.
- Il parle → Parle-t-il? (Add -t- when the verb ends in a vowel and the pronoun starts with a vowel.)

**Question words (mots interrogatifs):**

| Mot | Signification |
|-----|---------------|
| qui | who |
| que / qu'est-ce que | what |
| où | where |
| quand | when |
| pourquoi | why |
| comment | how |
| combien | how much / how many |

**Tip:** In everyday spoken French, intonation questions are the most common. Est-ce que is safe and neutral in all contexts.$txt$,
      1
    );

    -- pos 2: MC
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson5_id, 'Practice: identify the question type', 'practice', 'mc',
      $json${"type":"mc","prompt":"What question strategy is used in: 'Est-ce que vous habitez à Paris?'","options":["Intonation","Est-ce que","Inversion","Question word"],"correctAnswer":"Est-ce que"}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson5_id, 'Practice: form a question with est-ce que', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Rewrite as an est-ce que question: 'Tu aimes le chocolat.' Start your answer with 'Est-ce que'.","correctAnswer":"Est-ce que tu aimes le chocolat?"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson5_id, 'Write questions using all three strategies', 'writing',
      $json${"type":"written","prompt":"Write one question using each of the three strategies (intonation, est-ce que, inversion). Ask about a classmate's habits or preferences.","hints":"Tu aimes la musique?\nEst-ce que tu fais du sport le week-end?\nAimes-tu voyager?"}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 6: Futur proche: aller + infinitive (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'futur-proche', 'Futur proche: aller + infinitive', 12, 6)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson6_id;

  IF v_lesson6_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson6_id, 'Talking about the near future', 'explainer',
      $txt$## Talking about the near future

The **futur proche** (near future) expresses actions that are about to happen or planned for the near future. It is formed with a conjugated form of **aller** + an infinitive.

**Formula: aller (conjugated) + infinitif**

| Pronom | Aller | Exemple |
|--------|-------|---------|
| je | vais | Je vais manger. |
| tu | vas | Tu vas étudier. |
| il / elle | va | Elle va partir. |
| nous | allons | Nous allons voyager. |
| vous | allez | Vous allez finir. |
| ils / elles | vont | Ils vont vendre la voiture. |

**Negation in futur proche:** Place ne...pas around aller.
→ Je ne vais pas manger. (I am not going to eat.)

**Tip:** Futur proche is more common in spoken French than the simple future tense.$txt$,
      1
    );

    -- pos 2: conjugation-single
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson6_id, 'Practice: choose the aller form', 'practice', 'conjugation-single',
      $json${"type":"conjugation-single","prompt":"Nous _____ (aller) visiter le musée demain. Fill in the correct form of aller.","correctAnswer":"allons"}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson6_id, 'Practice: complete the futur proche', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Elles vont _____ (étudier) pour l'examen ce soir. Fill in the infinitive.","correctAnswer":"étudier"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson6_id, 'Write about your weekend plans', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences about what you and your friends are going to do this weekend. Use futur proche.","hints":"Je vais regarder un film avec mes amis.\nNous allons manger au restaurant samedi soir.\nElle va faire du sport dimanche matin."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 7: Passé composé with avoir (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'passe-compose-avoir', 'Passé composé with avoir', 12, 7)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson7_id;

  IF v_lesson7_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson7_id, 'Talking about the past with avoir', 'explainer',
      $txt$## Talking about the past with avoir

The **passé composé** is the most common past tense in spoken French. For most verbs it uses avoir as the auxiliary (helping verb) + a past participle.

**Formula: avoir (conjugated) + participe passé**

| Pronom | Avoir | Exemple (manger) |
|--------|-------|-----------------|
| je | ai | j'ai mangé |
| tu | as | tu as mangé |
| il / elle | a | il a mangé |
| nous | avons | nous avons mangé |
| vous | avez | vous avez mangé |
| ils / elles | ont | ils ont mangé |

**Forming the past participle:**
| Groupe | Règle | Exemple |
|--------|-------|---------|
| -ER verbs | -ER → -é | parler → parlé |
| -IR verbs | -IR → -i | finir → fini |
| -RE verbs | -RE → -u | vendre → vendu |

**Tip:** With avoir, the past participle does NOT agree with the subject in gender or number (unlike être verbs).$txt$,
      1
    );

    -- pos 2: conjugation-table (full passé composé forms for manger)
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson7_id, 'Practice: conjugate manger in the passé composé', 'practice', 'conjugation-table',
      $json${"type":"conjugation-table","prompt":"Conjugate manger (to eat) in the passé composé with avoir.","verb":"manger","answers":{"je":"ai mangé","tu":"as mangé","il":"a mangé","nous":"avons mangé","vous":"avez mangé","ils":"ont mangé"}}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson7_id, 'Practice: supply the past participle', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"Hier, nous avons _____ (finir) nos devoirs avant le dîner. Fill in the past participle.","correctAnswer":"fini"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson7_id, 'Write about yesterday', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences describing what you did yesterday. Use the passé composé with avoir.","hints":"Hier, j'ai étudié le français pendant une heure.\nNous avons mangé une pizza en famille.\nJ'ai fini mes devoirs et j'ai regardé un film."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 8: Passé composé with être (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'passe-compose-etre', 'Passé composé with être', 12, 8)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson8_id;

  IF v_lesson8_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson8_id, 'Motion verbs and être in the passé composé', 'explainer',
      $txt$## Motion verbs and être in the passé composé

A group of verbs — mostly motion and state-of-being verbs — use **être** (not avoir) as the auxiliary in the passé composé. The past participle **must agree** in gender and number with the subject.

**The VANDERTRAMP verbs (and their participes passés):**

| Infinitif | Participe passé |
|-----------|----------------|
| Venir | venu(e) |
| Aller | allé(e) |
| Naître | né(e) |
| Descendre | descendu(e) |
| Entrer | entré(e) |
| Rester | resté(e) |
| Tomber | tombé(e) |
| Retourner | retourné(e) |
| Arriver | arrivé(e) |
| Mourir | mort(e) |
| Partir | parti(e) |

**Agreement examples:**

| Sujet | Forme |
|-------|-------|
| Il est allé. | (masculine singular — no change) |
| Elle est allée. | (feminine singular — add -e) |
| Ils sont allés. | (masculine plural — add -s) |
| Elles sont allées. | (feminine plural — add -es) |

**Tip:** All reflexive verbs also use être in the passé composé.$txt$,
      1
    );

    -- pos 2: matching (VANDERTRAMP infinitives → past participles)
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson8_id, 'Practice: match verb to past participle', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each verb to its past participle.","pairs":[{"left":"aller","right":"allé"},{"left":"venir","right":"venu"},{"left":"partir","right":"parti"},{"left":"arriver","right":"arrivé"}]}$json$,
      2
    );

    -- pos 3: conjugation-single
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson8_id, 'Practice: être + past participle', 'practice', 'conjugation-single',
      $json${"type":"conjugation-single","prompt":"Elle _____ partie tôt ce matin. (She left early this morning.) Fill in the correct form of être.","correctAnswer":"est"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson8_id, 'Write about a trip or journey', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences about a trip or outing you took. Use être verbs in the passé composé and remember to make the participle agree.","hints":"Je suis allé(e) au marché samedi matin.\nNous sommes arrivés à la gare à midi.\nElle est partie en voyage la semaine dernière."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 9: Direct object pronouns (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'object-pronouns', 'Direct object pronouns', 12, 9)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson9_id;

  IF v_lesson9_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson9_id, 'Replacing nouns with direct object pronouns', 'explainer',
      $txt$## Replacing nouns with direct object pronouns

Direct object pronouns replace the direct object of a verb to avoid repetition.

| Pronom | Remplace | Exemple |
|--------|----------|---------|
| le | masculine singular noun | Je vois le film. → Je le vois. |
| la | feminine singular noun | J'aime la pizza. → Je l'aime. |
| l' | singular noun before vowel/h | J'attends l'autobus. → Je l'attends. |
| les | any plural noun | Tu lis les livres. → Tu les lis. |

**Placement rules:**
- Before the conjugated verb in simple tenses: Je **le** vois.
- Before the infinitive in futur proche: Je vais **le** voir.
- In passé composé: Je **l'**ai vu.

**Contraction:** la and le become l' before a vowel or silent h.

**Tip:** Identify the gender and number of the noun being replaced to choose the right pronoun.$txt$,
      1
    );

    -- pos 2: MC
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson9_id, 'Practice: choose the correct pronoun', 'practice', 'mc',
      $json${"type":"mc","prompt":"Tu lis le livre. Which pronoun replaces 'le livre'?","options":["le","la","l'","les"],"correctAnswer":"le"}$json$,
      2
    );

    -- pos 3: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson9_id, 'Practice: replace the noun', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"J'aime les fraises. Replace 'les fraises' with the correct direct object pronoun: Je _____ aime.","correctAnswer":"les"}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson9_id, 'Write sentences using object pronouns', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences about things you like, watch, or read. Replace at least one noun per sentence with le, la, l', or les.","hints":"Je le regarde tous les soirs. (le film)\nNous l'étudions en classe. (le français)\nElle les aime beaucoup. (les romans)"}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 10: Adjective placement: BAGS rule (NEW — idempotent)
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_french2_id, 'adjective-placement', 'Adjective placement: BAGS rule', 12, 10)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson10_id;

  IF v_lesson10_id IS NOT NULL THEN

    -- pos 1: explainer
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson10_id, 'Where to place adjectives in French', 'explainer',
      $txt$## Where to place adjectives in French

In French, most adjectives come **after** the noun. However, a small group of common adjectives come **before** the noun. The mnemonic **BAGS** helps you remember them.

**BAGS adjectives (placed BEFORE the noun):**

| Catégorie | Adjectifs | Exemple |
|-----------|-----------|---------|
| **B**eauty | beau, joli | un beau jardin |
| **A**ge | jeune, vieux, nouveau | une vieille maison |
| **G**oodness | bon, mauvais, meilleur | un bon repas |
| **S**ize | grand, petit, gros, long | un petit chien |

**Most other adjectives come AFTER the noun:**

| Catégorie | Exemple |
|-----------|---------|
| Colors | une robe rouge |
| Shape | une table ronde |
| Nationality | un étudiant français |
| Religion | une fête catholique |

**Examples of BAGS adjectives before the noun:**
- un grand appartement (a large apartment)
- une jolie fille (a pretty girl)
- un vieux livre (an old book)
- une bonne idée (a good idea)

**Tip:** When in doubt, place the adjective after the noun — that is correct for the vast majority of French adjectives.$txt$,
      1
    );

    -- pos 2: fill-in
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson10_id, 'Practice: place the adjective correctly', 'practice', 'fill-in',
      $json${"type":"fill-in","prompt":"C'est une _____ maison. Fill in the blank with the correct form of 'vieux' (old) before the noun.","correctAnswer":"vieille"}$json$,
      2
    );

    -- pos 3: matching (BAGS categories)
    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson10_id, 'Practice: match adjective to BAGS category', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each adjective to its BAGS category.","pairs":[{"left":"beau","right":"Beauty"},{"left":"vieux","right":"Age"},{"left":"bon","right":"Goodness"},{"left":"petit","right":"Size"}]}$json$,
      3
    );

    -- pos 4: writing
    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson10_id, 'Write descriptions using BAGS and non-BAGS adjectives', 'writing',
      $json${"type":"written","prompt":"Write 3–4 sentences describing people, places, or things. Use at least one BAGS adjective before a noun and one color or nationality adjective after a noun.","hints":"C'est un grand parc avec des fleurs rouges.\nElle porte une jolie robe bleue.\nNous habitons dans une vieille ville française."}$json$,
      4
    );

  END IF;

END;
$body$;
