-- Before You Start: Phonics & Pronunciation
-- Level 0 — always unlocked (locking rule: levelNumber > watermark; 0 > any positive watermark = false).
-- Accessible to all students regardless of placement result.
--
-- Inserts:
--   1 new level: before-you-start (level_number = 0)
--   5 lessons × 4 sub-components = 20 sub-components
--
-- Safe to re-run (idempotent):
--   Level INSERT uses ON CONFLICT (slug) DO NOTHING; id is fetched via SELECT after.
--   Lesson INSERTs use ON CONFLICT (level_id, slug) DO NOTHING RETURNING id.
--   Sub-component INSERTs are guarded by IF v_lessonN_id IS NOT NULL THEN.
--
-- Dollar-quoting strategy:
--   Outer block:   $body$...$body$
--   JSON content:  $json$...$json$
--   Markdown text: $txt$...$txt$

DO $body$
DECLARE
  v_bys_id     uuid;
  v_lesson1_id uuid;
  v_lesson2_id uuid;
  v_lesson3_id uuid;
  v_lesson4_id uuid;
  v_lesson5_id uuid;
  v_lesson6_id  uuid;
  v_lesson7_id  uuid;
  v_lesson8_id  uuid;
  v_lesson9_id  uuid;
  v_lesson10_id uuid;
  v_lesson11_id uuid;
BEGIN

  -- ============================================================
  -- Level: Before you start (level_number = 0)
  -- ============================================================

  INSERT INTO public.levels (slug, name, level_number, description)
  VALUES (
    'before-you-start',
    'Before you start',
    0,
    'The sounds and rhythms of French — no vocabulary required.'
  )
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_bys_id
    FROM public.levels
   WHERE slug = 'before-you-start';

  IF v_bys_id IS NULL THEN
    RAISE EXCEPTION 'before-you-start level not found after insert.';
  END IF;

  -- ============================================================
  -- Lesson 1: The French alphabet
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'french-alphabet', 'The French alphabet', 10, 1)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson1_id;

  IF v_lesson1_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson1_id, 'How the French alphabet sounds', 'explainer',
      $txt$## The French alphabet

The French alphabet has the same 26 letters as English, but several are pronounced very differently.

**Letters that trip up English speakers:**

| Letter | French sound | Example |
|--------|-------------|---------|
| **E** | "uh" (schwa) — or silent at end of words | le, que |
| **I** | "ee" (like English "feet") | ici, lit |
| **J** | "zh" (like the 's' in "measure") | je, jour |
| **R** | guttural — made at the back of the throat | rouge, rue |
| **U** | round your lips for "ee" — no English equivalent | tu, rue |
| **Y** | "ee-grek" — sounds like "ee" | yeux, style |

**Letters with context-dependent sounds:**

- **G before e or i:** sounds like "zh" — *girafe* → "zh-ee-raff"
- **C before e or i:** sounds like "s" — *ceci* → "suh-see"
- **H:** almost always silent — *heure*, *homme*
- **Q:** almost always followed by 'u', together pronounced "k" — *qui*, *que*$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson1_id, 'Practice: the letter j', 'practice', 'mc',
      $json${"type":"mc","prompt":"How is the letter 'j' pronounced in French?","options":["Like the 'j' in English 'jump'","Like the 's' in 'measure' or 'vision'","Like the 'y' in 'yes'","Like the 'h' in 'hello'"],"correctAnswer":"Like the 's' in 'measure' or 'vision'"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson1_id, 'Practice: the vowel i', 'practice', 'mc',
      $json${"type":"mc","prompt":"The French letter 'i' sounds most like which English sound?","options":["The 'i' in 'bit'","The 'ee' in 'feet'","The 'y' in 'yes'","The 'ai' in 'bait'"],"correctAnswer":"The 'ee' in 'feet'"}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson1_id, 'Reflect: your first impressions', 'writing',
      $json${"type":"written","prompt":"Which letter in the French alphabet surprises you most or seems hardest to pronounce? Describe the sound in your own words — how is it different from English?"}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 2: Accent marks
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'accent-marks', 'Accent marks', 8, 2)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson2_id;

  IF v_lesson2_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson2_id, 'What accent marks do', 'explainer',
      $txt$## Accent marks in French

French uses five accent marks. Most change pronunciation; the cédille changes the consonant entirely.

| Accent | Name | Effect | Example |
|--------|------|--------|---------|
| **é** | accent aigu | closed "ay" sound | étudier, café |
| **è** | accent grave | open "eh" sound (like "bed") | très, père |
| **ê** | accent circonflexe | same as è, slightly longer | fête, être |
| **à / â** | grave / circonflexe | mostly unchanged pronunciation; distinguishes words | à (at) vs a (has) |
| **ç** | cédille | makes 'c' sound like "s" | français, garçon |
| **ï / ë** | tréma | pronounce the two vowels as separate syllables | naïf, Noël |

**Key rule:** The plain letter 'e' is a neutral schwa ("uh"). The accent aigu **closes** it to a crisp "ay". The accent grave **opens** it to a wider "eh".$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson2_id, 'Practice: the cédille', 'practice', 'mc',
      $json${"type":"mc","prompt":"What does the cédille (ç) do to the letter c?","options":["Makes it sound like 'k'","Makes it sound like 's'","Makes it silent","Makes it sound like 'sh'"],"correctAnswer":"Makes it sound like 's'"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson2_id, 'Practice: match the accent', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each accent mark to its primary effect.","pairs":[{"left":"é (accent aigu)","right":"Closed 'ay' sound"},{"left":"è (accent grave)","right":"Open 'eh' sound"},{"left":"ç (cédille)","right":"C sounds like 's'"},{"left":"ï (tréma)","right":"Two vowels pronounced separately"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson2_id, 'Reflect: accents in words you know', 'writing',
      $json${"type":"written","prompt":"Write the names of two or three French words you already know that contain accent marks (like café, résumé, or naïf). For each one, describe how the accent changes how you say the letter compared to the plain version."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 3: Nasal vowels
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'nasal-vowels', 'Nasal vowels', 8, 3)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson3_id;

  IF v_lesson3_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson3_id, 'The four nasal vowels', 'explainer',
      $txt$## Nasal vowels

French has four nasal vowels — sounds where air flows through both your mouth and nose at the same time. They have no equivalent in English. A vowel becomes nasal when it is followed by **m** or **n** in the same syllable.

| Sound | Spelling patterns | Example words |
|-------|------------------|---------------|
| /ɑ̃/ | an, en, am, em | France, temps, enfant |
| /ɛ̃/ | in, ain, ein, im | vin, pain, faim |
| /ɔ̃/ | on, om | bon, nom, maison |
| /œ̃/ | un, um | un, parfum |

**Key rule:** If the m/n is **doubled**, or if a **vowel follows** the m/n, the vowel is NOT nasal.

- *an* → nasal: **dans** ("dɑ̃")
- *anne* → not nasal: **Anne** — the double 'n' breaks the nasality
- *une* → not nasal — the 'e' after 'n' breaks the nasality

**Tip:** Try saying "bon" while gently pinching your nose. You should feel resistance — that is the nasal resonance.$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson3_id, 'Practice: spot the nasal vowel', 'practice', 'mc',
      $json${"type":"mc","prompt":"Which of these words contains a nasal vowel?","options":["ami","bonjour","anne","une"],"correctAnswer":"bonjour"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson3_id, 'Practice: nasal spelling patterns', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each spelling pattern to its nasal vowel sound.","pairs":[{"left":"on / om","right":"/ɔ̃/ — as in bon"},{"left":"in / ain","right":"/ɛ̃/ — as in vin"},{"left":"an / en","right":"/ɑ̃/ — as in France"},{"left":"un / um","right":"/œ̃/ — as in un"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson3_id, 'Reflect: nasal sounds', 'writing',
      $json${"type":"written","prompt":"Nasal vowels are one of the biggest differences between French and English. In your own words, describe what a nasal vowel feels like compared to a regular vowel. Can you think of any English sounds that come close?","hints":"Think about whether the sound resonates in your nose or only in your mouth.\nEnglish consonants like the 'ng' in 'sing' are nasal, but English vowels are not.\nIn French, the vowel itself passes through the nose."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 4: Silent letters and liaison
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'silent-letters-liaison', 'Silent letters and liaison', 10, 4)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson4_id;

  IF v_lesson4_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson4_id, 'When not to pronounce letters', 'explainer',
      $txt$## Silent letters and liaison

### Silent final consonants

In French, most final consonants are **silent**. The mnemonic **CaReFuL** names the consonants that *are* usually pronounced when final:

- **C:** avec (with), parc
- **R:** pour (for), bonjour — but -ER verb infinitives drop the r: *parler* → "par-lay"
- **F:** neuf (nine), soif (thirst)
- **L:** il (he), sel (salt)

Everything else — d, s, t, x, z, p, g — is usually silent at the end of a word.

### H — the silent letter with rules

- **H muet (soft h):** treated as if absent — words link across it. *les hommes* → "ley-zom"
- **H aspiré (aspirated h):** blocks linking. *les haricots* → "lay ah-ree-ko" (not "ley-zah-ree-ko")

### Liaison

When a word ending in a normally-silent consonant is followed by a word beginning with a vowel (or h muet), the consonant is **pronounced** and links into the next word.

- *vous avez* → "voo-za-vay" (the 's' links)
- *les amis* → "ley-za-mee" (the 's' links)

Liaison is mandatory after articles, subject pronouns, and short prepositions.$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson4_id, 'Practice: liaison', 'practice', 'mc',
      $json${"type":"mc","prompt":"In 'vous avez' (you have), why is the 's' in 'vous' pronounced?","options":["Because 's' is always pronounced in French","Because of liaison — 'avez' starts with a vowel","Because 'vous' ends a stressed phrase","It is not pronounced in 'vous avez'"],"correctAnswer":"Because of liaison — 'avez' starts with a vowel"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson4_id, 'Practice: the CaReFuL rule', 'practice', 'mc',
      $json${"type":"mc","prompt":"Using the CaReFuL rule, which word has its final consonant pronounced?","options":["trop (too much) — ends in p","avec (with) — ends in c","est (is) — ends in t","grand (big) — ends in d"],"correctAnswer":"avec (with) — ends in c"}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson4_id, 'Reflect: silent letters', 'writing',
      $json${"type":"written","prompt":"Silent letters make French spelling feel disconnected from pronunciation at first. In your own words, explain the CaReFuL rule. Then give one example of a French word where the final consonant is pronounced and one where it is silent.","hints":"CaReFuL = C, R, F, L — these consonants are usually pronounced at the end of a word.\nPronounced finals: avec (c), pour (r), neuf (f), il (l).\nSilent finals: vous (s), grand (d), est (t), beaucoup (p)."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 5: Tricky consonant sounds
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'tricky-consonants', 'Tricky consonant sounds', 8, 5)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson5_id;

  IF v_lesson5_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson5_id, 'Five sounds to master', 'explainer',
      $txt$## Tricky consonant sounds

These five patterns catch English speakers off guard:

### The French R
Made at the back of the throat near the uvula — not at the front like English 'r'. Think of a very soft gargling sound. Practice with the word *rouge* (red).

### J and soft G (before e or i)
Both produce the "zh" sound — like the 's' in the English word *measure* or *vision*.
- *je* (I) → "zhuh"
- *girafe* → "zhee-raff"

### CH
French **ch** sounds like English **sh**, not "ch" as in "cheese".
- *chat* (cat) → "sha"
- *chocolat* → "sho-co-lah"

### QU
French **qu** always sounds like the English letter **k** — the 'u' is silent.
- *qui* (who) → "kee"
- *que* (that/what) → "kuh"

### GN
French **gn** sounds like the **ny** in the English word *canyon*.
- *champagne* → "sham-pan-yuh"
- *montagne* (mountain) → "mon-tan-yuh"$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson5_id, 'Practice: the CH sound', 'practice', 'mc',
      $json${"type":"mc","prompt":"How is 'ch' pronounced in the French word 'chocolat'?","options":["Like 'ch' in English 'cheese'","Like 'sh' in English 'shoe'","Like 'k' in English 'kite'","Like 'zh' in English 'measure'"],"correctAnswer":"Like 'sh' in English 'shoe'"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson5_id, 'Practice: match the sound', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each French spelling pattern to its approximate English sound.","pairs":[{"left":"ch (as in chat)","right":"'sh' as in shoe"},{"left":"j / g+e,i (as in je, girafe)","right":"'zh' as in measure"},{"left":"qu (as in qui)","right":"'k' as in kite"},{"left":"gn (as in montagne)","right":"'ny' as in canyon"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson5_id, 'Reflect: your hardest sound', 'writing',
      $json${"type":"written","prompt":"Of the five tricky consonant sounds covered in this lesson (r, j/g, ch, qu, gn), which do you think will be hardest for you to produce naturally? What strategy might help you practice it?","hints":"The French r is often cited as the hardest for English speakers — it requires a completely new part of the mouth.\nFor zh sounds, English words like 'measure' or 'vision' are good reference points.\nListening to native speakers and slowing down the sound can help a lot."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 6: Numbers
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'numbers', 'Numbers', 12, 6)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson6_id;

  IF v_lesson6_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson6_id, 'How French numbers work', 'explainer',
      $txt$## Numbers in French

### 0–20 (all unique — memorize these)

| | | | | |
|--|--|--|--|--|
| 0 zéro | 1 un | 2 deux | 3 trois | 4 quatre |
| 5 cinq | 6 six | 7 sept | 8 huit | 9 neuf |
| 10 dix | 11 onze | 12 douze | 13 treize | 14 quatorze |
| 15 quinze | 16 seize | 17 dix-sept | 18 dix-huit | 19 dix-neuf |
| 20 vingt | | | | |

### 21–69 (compound: tens + units)

| Tens | | |
|------|--|--|
| 30 trente | 40 quarante | 50 cinquante |
| 60 soixante | | |

Pattern: **tens + et + un** (for 21, 31 …) or **tens + hyphen + unit** (for others).
- 21 → vingt **et** un
- 22 → vingt-deux
- 35 → trente-cinq

### 70–79 — French says "sixty-ten"

French has no word for 70. Instead: **soixante-dix** (60 + 10) through **soixante-dix-neuf** (60 + 19).
- 70 → soixante-dix
- 75 → soixante-quinze
- 79 → soixante-dix-neuf

### 80–99 — "four twenties"

80 is **quatre-vingts** (4 × 20). The 's' drops when a number follows.
- 80 → quatre-vingts
- 81 → quatre-vingt-un (no 's', no *et*)
- 90 → quatre-vingt-dix
- 95 → quatre-vingt-quinze
- 99 → quatre-vingt-dix-neuf

### 100

100 → **cent**$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson6_id, 'Practice: how do you say 80?', 'practice', 'mc',
      $json${"type":"mc","prompt":"How do you say 80 in French?","options":["huitante","octante","quatre-vingts","soixante-vingt"],"correctAnswer":"quatre-vingts"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson6_id, 'Practice: match the number', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each number to its French word.","pairs":[{"left":"17","right":"dix-sept"},{"left":"70","right":"soixante-dix"},{"left":"80","right":"quatre-vingts"},{"left":"90","right":"quatre-vingt-dix"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson6_id, 'Reflect: the logic of French numbers', 'writing',
      $json${"type":"written","prompt":"French numbers 70–99 follow a very different logic from English (sixty-ten, four-twenties). In your own words, explain how 70, 80, and 90 are formed. Why do you think French developed this system?","hints":"70 = soixante-dix = 60 + 10\n80 = quatre-vingts = 4 × 20\n90 = quatre-vingt-dix = 4 × 20 + 10\nBelgium and Switzerland use septante (70), huitante (80), and nonante (90) instead."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 7: The months
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'months', 'The months', 6, 7)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson7_id;

  IF v_lesson7_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson7_id, 'The twelve months', 'explainer',
      $txt$## The months in French

**Key rule:** months are NOT capitalized in French (unlike English).

| # | French | Pronunciation tip |
|---|--------|------------------|
| 1 | janvier | "zhahn-vyay" |
| 2 | février | "fay-vree-yay" |
| 3 | mars | "mars" (the 's' is pronounced) |
| 4 | avril | "ah-vreel" |
| 5 | mai | "may" |
| 6 | juin | "zhwɛ̃" — nasal, rhymes with "between" |
| 7 | juillet | "zhwee-yay" |
| 8 | août | "oot" (the 'a' and 'u' are silent) |
| 9 | septembre | "sep-tɑ̃br" |
| 10 | octobre | "ok-tobr" |
| 11 | novembre | "no-vɑ̃br" |
| 12 | décembre | "day-sɑ̃br" |

**Saying dates:** French uses *en* before a month — *en janvier*, *en août*.
To give a full date: **le [day] [month]** — *le 14 juillet* (the 14th of July).$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson7_id, 'Practice: after juillet', 'practice', 'mc',
      $json${"type":"mc","prompt":"Which month comes directly after juillet (July) in French?","options":["juin","septembre","août","octobre"],"correctAnswer":"août"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson7_id, 'Practice: match the month', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each French month to its English equivalent.","pairs":[{"left":"février","right":"February"},{"left":"avril","right":"April"},{"left":"août","right":"August"},{"left":"décembre","right":"December"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson7_id, 'Reflect: months you recognize', 'writing',
      $json${"type":"written","prompt":"Several French months look very similar to their English counterparts (like octobre and octobre). Which months were easiest to learn and why? Which were hardest? Write your birthday in French using the format 'le [day] [month]'.","hints":"Easy ones: mars, avril, juin, juillet, octobre, novembre, décembre all look close to English.\nHarder ones: août (August) looks and sounds nothing like its English equivalent.\nExample birthday: le 3 mars, le 21 novembre."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 8: Days of the week
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'days-of-the-week', 'Days of the week', 6, 8)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson8_id;

  IF v_lesson8_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson8_id, 'The seven days', 'explainer',
      $txt$## Days of the week

**Key rules:**
- Days are NOT capitalized in French.
- The French week starts on **Monday**, not Sunday.
- Days are all masculine.

| French | English |
|--------|---------|
| lundi | Monday |
| mardi | Tuesday |
| mercredi | Wednesday |
| jeudi | Thursday |
| vendredi | Friday |
| samedi | Saturday |
| dimanche | Sunday |

**With vs without *le*:**
- *lundi* → this Monday (or next Monday coming up)
- *le lundi* → every Monday (recurring)

**Example:** *Je travaille le lundi.* (I work every Monday.)
*On se voit lundi.* (We'll see each other this Monday.)$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson8_id, 'Practice: after mercredi', 'practice', 'mc',
      $json${"type":"mc","prompt":"Which day comes directly after mercredi (Wednesday)?","options":["mardi","samedi","jeudi","vendredi"],"correctAnswer":"jeudi"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson8_id, 'Practice: match the day', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each French day to its English equivalent.","pairs":[{"left":"lundi","right":"Monday"},{"left":"jeudi","right":"Thursday"},{"left":"samedi","right":"Saturday"},{"left":"dimanche","right":"Sunday"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson8_id, 'Reflect: your week in French', 'writing',
      $json${"type":"written","prompt":"Write two sentences about your week using French days. For example: what day is your busiest, or what do you do on a specific day? Use the pattern 'le [jour]' for a recurring event or just '[jour]' for a specific day.","hints":"Le lundi, j'ai cours de français. (Every Monday, I have French class.)\nJe joue au foot samedi. (I play soccer this Saturday.)\nMon jour préféré est vendredi. (My favorite day is Friday.)"}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 9: Colors
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'colors', 'Colors', 8, 9)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson9_id;

  IF v_lesson9_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson9_id, 'The main colors', 'explainer',
      $txt$## Colors in French

Colors in French are adjectives, so they usually come **after** the noun (unlike English). You will learn noun gender fully in French 1 — for now, just learn the base color words.

| French | English | Note |
|--------|---------|------|
| rouge | red | |
| bleu | blue | feminine: bleue |
| vert | green | feminine: verte |
| jaune | yellow | same form |
| orange | orange | same form (no agreement) |
| blanc | white | feminine: blanche |
| noir | black | feminine: noire |
| gris | grey | feminine: grise |
| rose | pink | same form |
| violet | purple | feminine: violette |
| marron | brown | same form (no agreement) |
| beige | beige | same form |

**Word order:** *un chat noir* (a black cat) — color follows the noun.
Exceptions: a handful of common colors precede the noun (*beau*, *grand*, etc. are not colors, but small common adjectives do go before).

**The French flag:** bleu, blanc, rouge — left to right.$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson9_id, 'Practice: the French flag', 'practice', 'mc',
      $json${"type":"mc","prompt":"What are the three colors of the French flag, left to right?","options":["rouge, blanc, bleu","bleu, blanc, rouge","blanc, bleu, rouge","vert, blanc, rouge"],"correctAnswer":"bleu, blanc, rouge"}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson9_id, 'Practice: match the color', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each French color to its English equivalent.","pairs":[{"left":"vert","right":"green"},{"left":"noir","right":"black"},{"left":"blanc","right":"white"},{"left":"jaune","right":"yellow"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson9_id, 'Reflect: describe something', 'writing',
      $json${"type":"written","prompt":"Pick any three objects around you right now and describe their color in French. Use the pattern '[object] + [color]' — for example: 'mon stylo est bleu' (my pen is blue) or 'ma table est marron' (my table is brown).","hints":"Common objects: livre (book), chaise (chair), mur (wall), fenêtre (window), sac (bag), téléphone (phone).\nPattern: [noun] est [color] — Mon [noun] est [color]."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 10: Survival phrases
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'survival-phrases', 'Survival phrases', 8, 10)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson10_id;

  IF v_lesson10_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson10_id, 'The phrases you need first', 'explainer',
      $txt$## Survival phrases

These phrases let you navigate real French situations before you know any grammar.

### Politeness
| French | English | Note |
|--------|---------|------|
| merci | thank you | |
| merci beaucoup | thank you very much | |
| s'il vous plaît | please | formal / stranger |
| s'il te plaît | please | informal / friend |
| de rien | you're welcome | casual |
| je vous en prie | you're welcome | formal |

### When you're lost
| French | English |
|--------|---------|
| Excusez-moi | Excuse me (formal) |
| Excuse-moi | Excuse me (informal) |
| Pardon | Sorry / Excuse me (brief) |
| Je ne comprends pas. | I don't understand. |
| Pouvez-vous répéter ? | Can you repeat that? (formal) |
| Plus lentement, s'il vous plaît. | More slowly, please. |

### Agreement
| French | English |
|--------|---------|
| oui | yes |
| non | no |
| d'accord | okay / agreed |
| peut-être | maybe |

**Formal vs informal:** use *vous* forms (*excusez-moi*, *s'il vous plaît*) with strangers, teachers, and adults. Use *tu* forms (*excuse-moi*, *s'il te plaît*) with peers and friends.$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson10_id, 'Practice: formal or informal?', 'practice', 'mc',
      $json${"type":"mc","prompt":"You are speaking to a teacher you have never met. Which phrase do you use?","options":["Excuse-moi, s'il te plaît.","Excusez-moi, s'il vous plaît.","Pardon, tu peux répéter ?","Hé, répète !"],"correctAnswer":"Excusez-moi, s'il vous plaît."}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson10_id, 'Practice: match the phrase', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each French phrase to its English meaning.","pairs":[{"left":"Je ne comprends pas.","right":"I don't understand."},{"left":"Pouvez-vous répéter ?","right":"Can you repeat that?"},{"left":"Plus lentement, s'il vous plaît.","right":"More slowly, please."},{"left":"D'accord.","right":"Okay / Agreed."}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson10_id, 'Reflect: your most useful phrase', 'writing',
      $json${"type":"written","prompt":"Of all the survival phrases in this lesson, which three do you think you would use most if you were in France right now? Explain why each one would be useful to you personally.","hints":"Think about situations: ordering food, asking for directions, not understanding something someone said.\nThere is no wrong answer — this is about what matters to you."}$json$,
      4
    );

  END IF;

  -- ============================================================
  -- Lesson 11: Telling time
  -- ============================================================

  INSERT INTO public.lessons (level_id, slug, title, estimated_minutes, position)
  VALUES (v_bys_id, 'telling-time', 'Telling time', 10, 11)
  ON CONFLICT (level_id, slug) DO NOTHING
  RETURNING id INTO v_lesson11_id;

  IF v_lesson11_id IS NOT NULL THEN

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson11_id, 'How to say the time', 'explainer',
      $txt$## Telling time in French

### The basic formula

**Il est + [number] + heure(s)**

- *Il est une heure.* — It is one o'clock. (une, not un — heure is feminine)
- *Il est deux heures.* — It is two o'clock.
- *Il est dix heures.* — It is ten o'clock.

### Special times

| French | English |
|--------|---------|
| Il est midi. | It is noon. |
| Il est minuit. | It is midnight. |

### Minutes

| French | English | Example |
|--------|---------|---------|
| et quart | quarter past | Il est trois heures et quart. (3:15) |
| et demie | half past | Il est trois heures et demie. (3:30) |
| moins le quart | quarter to | Il est quatre heures moins le quart. (3:45) |
| [heures] [minutes] | exact minutes | Il est six heures vingt. (6:20) |
| moins [minutes] | minutes to | Il est sept heures moins dix. (6:50) |

### 24-hour clock

France commonly uses the 24-hour clock in writing and formal contexts (transport, schedules).
- 14h30 → quatorze heures trente (2:30 PM)
- 20h00 → vingt heures (8:00 PM)

### Asking the time

*Quelle heure est-il ?* — What time is it? (formal)
*Il est quelle heure ?* — What time is it? (informal)$txt$,
      1
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson11_id, 'Practice: half past three', 'practice', 'mc',
      $json${"type":"mc","prompt":"How do you say 3:30 in French?","options":["Il est trois heures et quart.","Il est trois heures et demie.","Il est trois heures moins le quart.","Il est trois heures trente minutes."],"correctAnswer":"Il est trois heures et demie."}$json$,
      2
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, problem_type, content, position)
    VALUES (
      v_lesson11_id, 'Practice: match the time', 'practice', 'matching',
      $json${"type":"matching","prompt":"Match each French time expression to its clock reading.","pairs":[{"left":"Il est midi.","right":"12:00 PM"},{"left":"Il est deux heures et quart.","right":"2:15"},{"left":"Il est cinq heures et demie.","right":"5:30"},{"left":"Il est huit heures moins le quart.","right":"7:45"}]}$json$,
      3
    );

    INSERT INTO public.sub_components (lesson_id, title, kind, content, position)
    VALUES (
      v_lesson11_id, 'Reflect: your daily schedule', 'writing',
      $json${"type":"written","prompt":"Write three sentences describing what you do at specific times of day, using French time expressions. For example: at what time do you wake up, eat lunch, or go to sleep?","hints":"Je me réveille à sept heures. (I wake up at seven o'clock.)\nJe mange à midi. (I eat at noon.)\nJe dors à onze heures. (I sleep at eleven o'clock.)\nUse 'à' before the time: à [heure]."}$json$,
      4
    );

  END IF;

END;
$body$;
