# French Learning Platform — Project Plan

A phased build plan for an adaptive French-learning website for high school students.

Project name: Frenchly — frenchly.org (domain ~$24/year). Support email: frenchlyorg@gmail.com.


## 1. The Vision in One Paragraph

A welcoming, minimalist web platform where high schoolers learn French through grammar lessons, reading, and writing practice. Students take a diagnostic placement test, then work through adaptive lessons organized by level (French 1–5, plus Culture and a real-world "Above & Beyond" section). Each lesson breaks into smaller trackable components and a mix of practice problems. Open-ended writing gets short, AI-powered feedback; everything with a known answer is checked instantly by code. Accounts save progress. Honest leaderboards and optional classes keep it motivating. The interface works in English, Spanish, and Simplified Chinese, while the French content stays in French (with instructions switching to French at the AP level).

Primary goal: get visitors to create an account so they don't lose progress.
Success metric: 1,000 accounts within 3 months of launch.
Timeline philosophy: built in phases over up to 2 years. A solid v1 first, then grow.


## 2. Key Decisions Already Locked In

These are settled, so we don't relitigate them later:

- **Leaderboard:** real users only. No bot/fake accounts at any stage. Classes + local leaderboards + streaks + "be the first!" empty states keep it lively while numbers are small.
- **AI checker:** short, single-line feedback only. Used only for open-ended writing. Everything auto-gradable (conjugation, fill-in-the-blank, multiple choice, matching) is checked by plain code — free and instant.
- **Translations:** machine-translated UI, hand-correctable later. French learning content stays in French.
- **Accounts:** email + username + password. No other personal info collected.
- **Donations:** your parents are the account holder (Stripe requires 18+). Donation page deferred to a later phase.
- **Live multiplayer** (Kahoot/Blooket-style): optional, final phase, only if time allows.
- **Hosting/stack:** Vercel + Supabase + Next.js (see Section 4).
- **Design:** warm-only or cool-only palettes per mode. Light mode = white + light red. Dark mode = black + orange. Subtle motion, skeleton loaders, encouraging loading messages (≤8 words).


## 3. Scope: What v1 Is (and Isn't)

Content shape (revised down to ~50 lessons total):

- Weighted toward French 2 and French 3 (the lesson-heavy levels).
- French 1, 4, 5 lighter on lessons.
- Mostly grammar rules, supported by many practice problems.
- Culture (~10 lessons) and Above & Beyond (slang, regional variation, real speech) come in later phases.

v1 = the foundation that proves the product works:

- Full site design + theming (light/dark, warm/cool).
- Accounts (sign up, log in, save progress).
- Lesson structure with trackable sub-components.
- The AI writing checker (one-line feedback) + code-based checking for auto-gradable problems.
- French 1–2 fully built out as the first real content.
- Diagnostic placement test (initial) + end-of-level diagnostics.

Later phases add: remaining French levels, Culture, Above & Beyond, AP/French 5 with French-language instructions, classes, global leaderboards at scale, donation page, AP French practice section, and (last, optional) live multiplayer.


## 4. Tech Stack (and Why)

| Layer | Choice | Why |
|-------|--------|-----|
| Design (visuals) | Google Stitch | AI design tool used first to settle the look — layout, colors, typography, feel. Produces the "skin," not the working app. |
| Build tool | Claude Code | Anthropic's command-line coding tool, run on your own computer. Turns the design into the real working site (the "engine + skeleton"). |
| Framework | Next.js (React) | Works seamlessly with Vercel, handles multi-page sites well, huge community + AI-tool support (matters since you'll lean on tools). |
| Styling | Tailwind CSS | Fast, consistent, easy theming for light/dark + warm/cool palettes. Keeps the minimalist look tidy. |
| Hosting | Vercel | Your pick. One-click deploys, scales painlessly at your size. |
| Backend / DB / Auth | Supabase | Gives you accounts, database, and security out of the box. Far easier than building auth yourself. |
| AI checker | Claude Haiku 4.5 via API | Cheapest current-gen model, built for fast short responses. |
| Payments (later) | Stripe | Industry standard; your parents hold the account. |
| Email | Dedicated email service (decide later) | Reliable delivery for confirmations/resets. Free tiers cover your scale. |

The workflow — design first, then build: Google Stitch generates the visual design (layout, palette, typography). Claude Code then builds the working platform (accounts, database, adaptive lessons, AI checker, progress saving) using that design as the visual reference. Think of Stitch as the skin and Claude Code + Supabase as the engine and skeleton underneath. Stitch alone cannot produce the accounts, database, or lesson logic — that's the build phase.

Why a backend at all: saving progress across devices requires real accounts + a database. A static site can't do that. Supabase is what makes the "don't lose your progress" goal possible.


## 5. Page / Site Structure

Nine pages to start (you'll supply the actual content later):

1. **Home** — what the site is, clear "create account" call to action.
2. **Mission** — the why behind the project.
3. **French 1** — adaptive; unlocked by diagnostic.
4. **French 2** — lesson-heavy.
5. **French 3** — lesson-heavy.
6. **French 4** — lighter.
7. **French 5 / AP** — instructions in French; AP French practice lives here or adjacent.
8. **Above & Beyond** — real-world French (slang, regional differences) — later phase.
9. **Donation page** — later phase, points at parents' Stripe account.

Plus supporting pieces: account/login, dashboard (progress, streaks, leaderboard), contact/support, and a Culture section as it comes online.

Each level page shows: an approximate time label per lesson, locked/unlocked state based on the student's diagnostic level, and the lesson's trackable sub-components.

Access logic: initial diagnostic places the student. End-of-level diagnostic must be passed to unlock the next level. Students see the right level guided to them; higher levels stay locked until earned.


## 6. The Adaptive System

- Initial diagnostic on first use → places the student at the right level.
- Per-level diagnostics at the end of each level → pass to advance.
- Lessons within a level draw from the student's placement.
- Every main lesson contains several smaller trackable components so progress is granular and motivating.


## 7. The AI Writing Checker

How it works: when a student submits open-ended writing, the app sends grading instructions + the sentence to Claude Haiku 4.5 and gets back one concise line pointing out the main issues.

Cost-control built in from day one:

- Code-check everything auto-gradable (conjugation, fill-in-the-blank, MC, matching) — no AI, free, instant.
- Cap response length to one line.
- Prompt caching — grading instructions are identical every call, so caching cuts that cost ~90%.
- Per-user rate limits so nobody can spam submissions and run up cost.
- Billing alerts on the API account.

Estimated cost: ~$0.0005 per check. At 1,000 active users doing ~20 checks/month each (~20,000 checks) ≈ ~$11/month. Heavy case (100 checks each) ≈ ~$55/month.


## 8. Motivation Features

- **Leaderboard:** top 100 most active users. Real users only. "Active" = something like 20 min/day or 5 lessons/week (tunable).
- **Classes:** students grouped (e.g., by teacher) so a small class leaderboard feels alive on day one — this is the honest fix for the "empty leaderboard" problem.
- **Streaks & personal bests:** keep solo learners motivated regardless of ranking.
- **Honest empty states:** "Be the first on the board!" instead of fake accounts.
- **Live multiplayer** (final, optional phase): Kahoot/Blooket-style lobbies, fastest-answer competition, user-made or one-click auto-generated question sets from user-set parameters. This is the hardest single feature (real-time sync) — deliberately last.


## 9. Design & UX

- **Vibe:** welcoming, minimalist, spaced out. Not flashy 3D / overwhelming.
- **Light mode:** mostly white + light red (all warm).
- **Dark mode:** mostly black + orange (all warm).
- **Rule:** any mode stays within one temperature family — no clashing accent colors.
- **Imagery:** likely abstract graphics (decide later).
- **Motion:** subtle only.
- **Skeleton loaders** before pages finish loading.
- **Loading bar** after each lesson with a short encouraging message (≤8 words) as the next lesson loads.
- **Timezone bar:** lets users input their timezone for an optional time-based shift.
- **Fonts:** to be chosen during the Stitch design step.

Status: the visual design is done — produced in the design step and captured as the design system of record in Section 9b below ("Warm Scholastic Minimalist" / "The Warm Atelier"). It faithfully hits the brief: warm-only palette, guillemets motif, minimalist spacing, sentence-case copy. Next step is handing it to Claude Code to translate into a Tailwind config and build against.

Tweaks decided (apply at build time):

- **Accessibility/contrast:** use the darker primary (`#a03e40`) as the actual button fill with white text (passes WCAG AA); reserve the lighter coral (`#e57373`) for hover, borders, and large elements. Verify all accent-on-background ratios with a contrast tool before locking.
- **Green = correctness only.** The cool-green tertiary is kept strictly for "correct answer / success" feedback (a deliberate exception to warm-only, because "right = green" is universally understood). It appears nowhere else; the brand stays warm everywhere else.
- **Dark mode palette:** now defined as a deliberate companion (see 9b), not improvised — warm charcoals + orange lead accent + warm off-white text.
- **Inputs:** pick one style (underlined or lightly boxed) and use it consistently — recommend lightly boxed with a coral focus border for clarity on low-quality school screens.
- Confirm the airy 1.78× body line-height feels right on long French passages once real content is in.


## 9b. Design System of Record — "Warm Scholastic Minimalist"

The full token file lives in DESIGN.md (colors, typography, spacing, components). This section is the human-readable companion plus the dark-mode palette generated to complete it. DESIGN.md is the source of truth.

**Concept:** "The Warm Atelier" — a quiet, sun-drenched library. Academic yet approachable; deliberately not gamified/high-energy.

**Type system:** Literata (scholarly serif — headings, logo, guillemet decoration) · Be Vietnam Pro (legible sans — body, generous ~1.75–2× line height for parsing French) · Work Sans (utility — labels like "5 min read", "Level A1").

**Light palette (from DESIGN.md):** warm bone/cream surfaces (`#fff8f5` background), charcoal text (`#1e1b18`), coral primary (`#a03e40` fill / `#e57373` light), warm-orange secondary (`#835500` / `#feb64c`), green reserved for success only (`#006c4a` / `#24a978`).

**Layout:** 720px lesson width, 1040px dashboard container, 80px+ section gaps. Tonal layers over shadows (the "paper" feel). 8px component radius / 16px container radius. Guillemets (« ») as decorative frames and the active-lesson marker.

### Generated dark-mode palette (the companion DESIGN.md was missing)

Same warm DNA; orange leads (per brief); warm charcoals instead of pure black. Light-on-dark makes contrast the easy direction, so warmer/brighter accents are safe here. Verify final ratios at build, but these are chosen to pass WCAG AA.

```
# Dark mode — Warm Scholastic Minimalist
background:                 #1a1715   # warm near-black (not pure black)
surface:                    #1a1715
surface-container-lowest:   #141110
surface-container-low:      #221e1c
surface-container:          #262220
surface-container-high:     #312c29
surface-container-highest:  #3c3633
on-surface:                 #f0e7e2   # warm off-white text
on-surface-variant:         #d6c5c0
outline:                    #9c8580
outline-variant:            #534340

# Orange leads in dark mode (the "candle-lit glow")
primary:                    #ffb866   # warm orange — primary actions/highlights
on-primary:                 #3a2400   # dark text on the orange
primary-container:          #6b4a16
on-primary-container:       #ffdcb0

# Coral kept as a secondary warm accent so the brand still rhymes with light mode
secondary:                  #ffb3b1   # soft coral for secondary accents
on-secondary:               #5e0c15
secondary-container:        #80272b
on-secondary-container:     #ffdad8

# Success (correctness only) — brightened green for dark bg
tertiary:                   #63dca7
on-tertiary:                #003522
tertiary-container:         #005237
on-tertiary-container:      #81f9c2

# Error
error:                      #ffb4ab
on-error:                   #690005
error-container:            #93000a
on-error-container:         #ffdad6
```

Theming note for build: define both palettes as CSS custom properties / Tailwind theme tokens and switch via a `data-theme` or `.dark` class. Same component code, two token sets — the "one brand, two outfits" goal.


## 10. Internationalization

- **UI source language:** English. All interface strings live in one central place.
- **Translated to:** Spanish + Simplified Chinese (machine translation, hand-correctable).
- **French content:** stays in French (it's what's being taught).
- **Instructions switch to French** starting at French 5 / AP.


## 11. Security, Reliability & Quality

This section sorts engineering best practices into what Frenchly needs now, what comes later, and what doesn't apply (with reasons, so nothing looks ignored). Frenchly is a solo-plus-friends educational project for mostly US high schoolers, so the bar is "genuinely secure and responsible," not "enterprise compliance program." Much of the heavy lifting (TLS, backups, infra reliability, per-user data isolation) is handled by Supabase and Vercel rather than built from scratch.

### From day one (build these in)

- **No secrets in front-end code — ever.** API keys, tokens, passwords live only in server-side environment variables. Covers: secrets management.
- **Authentication, authorization & roles.** Supabase handles sign-up/login, password hashing, sessions, and token expiry. Define at least two roles: student (default) and admin/editor. Covers: auth, roles/permissions, session management.
- **Input sanitization & injection prevention.** All user input is treated as untrusted. Use Supabase's parameterized queries (no raw SQL string-building) and escape user content on display. Covers: input sanitization, injection prevention.
- **Per-user data isolation.** Supabase Row-Level Security so a student can only read/write their own progress. Covers: data isolation.
- **HTTPS/TLS** — handled by Vercel. Certificates provisioned and rotated automatically. Covers: HTTPS, TLS, certificate rotation.
- **Rate limiting & abuse prevention.** Per-user limits on AI-checker submissions and auth attempts. Covers: rate limiting, abuse prevention.
- **PII handling, retention & deletion.** Collect only email + username + password. Students can delete their account and data. Plain-language privacy policy. Covers: PII handling, data retention/deletion.
- **Dependency scanning & patching.** GitHub Dependabot alerts to flag and patch vulnerable packages. Covers: dependency scanning, vulnerability patching.
- **Basic error handling & graceful degradation.** If the AI checker is down, the lesson still works; never crash the whole page over one failed call. Covers: error handling, graceful degradation.
- **Accessibility.** Sufficient color contrast, keyboard navigation, alt text, screen-reader-friendly markup. Covers: accessibility.
- **A light set of tests.** Automated tests for the highest-stakes paths (login, saving progress, the diagnostic that unlocks levels). Covers: the day-one slice of testing.

### Later phases (real, but not v1)

- Fuller testing pyramid: unit + integration + end-to-end + regression tests, with coverage thresholds enforced in CI.
- Code review process & standards once friends are committing regularly.
- Resilience around the AI API: retry logic with backoff, idempotency, circuit breakers, and fallback behavior.
- Broader caching strategy & invalidation.
- Concurrency & race-condition handling (mainly for leaderboards at scale and live multiplayer).
- Logging & audit trail — basic logging early; richer audit trail if/when admin actions and many editors warrant it.
- Architecture diagrams + ADRs — simple diagram of how pieces fit + short records of key decisions.
- Backup/recovery awareness — rely on Supabase's managed backups; document a one-page restore path.

### Not applicable / deliberately out of scope

- **HIPAA:** does not apply — Frenchly handles no health data.
- **Formal GDPR compliance program:** audience is mostly US high schoolers. Practical obligations (data minimization, deletion, clear privacy policy) are covered above. Revisit if meaningful EU traffic appears.
- **Formal RTO/RPO targets & full disaster-recovery plan:** sized for systems where downtime costs money/safety. Supabase + Vercel durability + one-page restore note is the right-sized substitute.
- **Chaos engineering & load/stress testing:** premature at this scale on managed infra.
- **Heavyweight multi-tenancy architecture:** unnecessary — Row-Level Security already isolates students.

### Performance

Keep it light and fast on school devices — lean pages, skeleton loaders, no heavy 3D. Performance doubles as accessibility: many school Chromebooks are low-powered.


## 12. Cost Summary (at 1,000 active users)

During development: ~$0/month. Next.js + Tailwind are free and run locally; Supabase and Vercel free tiers cover building and testing; the AI API is pennies for test calls. The only early spend is the domain (~$24/yr).

**Recurring monthly (at launch), excluding coding tools:**

| Item | Realistic | If usage runs hot |
|------|-----------|-------------------|
| Vercel Pro (1 seat) | $20 | $20 |
| Supabase Pro | $25 | $25 |
| AI writing checker | $15 | $55 |
| Support bot | $5 | $10 |
| Email | $0 | $20 |
| Domain (amortized) | ~$1 | ~$1 |
| **Total** | **~$66/mo** | **~$131/mo** |

Annualized: ~$800–1,600/year. The two fixed subscriptions (Vercel + Supabase = $45) are the bulk. Peers can edit content via the database instead of paid Vercel seats. Live multiplayer, if built, is costed separately. Prices current as of June 2026; set billing alerts on all paid services.


## 13. Timeline & Phasing

The hard truth: a fully-featured launch by Aug 20, 2026 is not feasible. What is feasible by then is a strong v1. Everything else spreads across up to 2 years.

### Phase 0 — Setup (low/no cost to start)

- Buy domain: frenchly.org (~$24/yr) — grab it to lock the name. (Only real spend needed now.)
- Create the project Gmail (frenchlyorg@gmail.com) and turn on 2-factor authentication.
- Paid subscriptions are deferred: Vercel Pro + Supabase Pro ($45/mo base) not needed during building. Use free tiers while developing; upgrade only at public launch.
- Anthropic API is pay-per-use (pennies during dev) — set up with a billing alert when wiring the AI checker.

### Phase 1a — Design (in Google Stitch)

- Generate the visual look in Stitch using the design direction in Section 9 (warm palettes, guillemets motif, typography, card-based level nav, light/dark).
- Settle layout, colors, and fonts here before building.
- Output = the design/skin, not the working app.

### Phase 1b — Build foundation (in Claude Code; target: v1 by ~Aug 2026)

- Next.js + Tailwind project, theming (light/dark, warm-only) based on the Stitch design.
- Supabase (free tier) accounts: sign up / log in / save progress.
- Lesson framework with trackable sub-components.
- AI writing checker + code-based checking.
- Skeleton loaders + post-lesson loading messages.
- French 1–2 content (you supply).
- Initial diagnostic + end-of-level diagnostic.
- Security/quality baked in: Supabase auth + roles (student/admin), Row-Level Security, input sanitization, secrets in env vars only, account/data deletion, dependency scanning on, basic error fallbacks, accessibility, and light tests on login / save-progress / diagnostic.

### Phase 2 — Core Content & Motivation

- French 3 (lesson-heavy), then 4.
- Streaks, personal bests.
- Leaderboard (real users) + classes.
- English/Spanish/Chinese UI translations wired in.
- Quality: start a lightweight code-review rule (one reviewer per change) as friends begin contributing; begin the architecture diagram + ADRs.

### Phase 3 — Advanced

- French 5 / AP with French-language instructions.
- AP French practice section.
- Culture section (~10 lessons).
- Above & Beyond (slang, regional variation).
- Resilience: add retry/backoff, idempotency, and fallback behavior around the AI API as usage grows.

### Phase 4 — Sustain & Extend

- Donation page (via parents' Stripe).
- AI support bot (if desired).
- Polish, performance, accessibility passes.
- Testing maturity: grow toward fuller unit/integration/e2e + regression coverage, with thresholds in CI; one-page backup/restore note.

### Phase 5 — Optional Final

- Live multiplayer (Kahoot/Blooket-style): lobbies, fastest-answer, user-made + auto-generated sets.
- Concurrency/race-condition handling becomes relevant here and for leaderboards at scale.


## 14. Open Items / What's Needed From You

- [x] Project name + domain decided: Frenchly / frenchly.org
- [x] Support email address: frenchlyorg@gmail.com
- [x] Design system done: "Warm Scholastic Minimalist" (DESIGN.md) + dark palette + tweaks captured
- [ ] Buy the domain frenchly.org (~$24/yr) to lock the name
- [ ] Lesson content for French 1–2 to start (then onward)
- [ ] At build: verify contrast ratios (esp. coral button fill) with a WCAG tool
- [ ] Confirm "active user" thresholds for the leaderboard (e.g., 20 min/day, 5 lessons/week)
- [ ] Decide email service when we reach the build phase
- [ ] (Optional, growth stage) Trademark attorney check once the project is established / money flows


## 15. Guiding Principles

- **Honesty builds trust** — real leaderboards, no deception. The product's whole appeal is genuine learning.
- **Don't overwhelm** — minimalist, spaced out, calm. No flashy clutter.
- **Spend where it matters** — code-check the free stuff, AI only for real writing.
- **Security first** — no secrets in the browser, minimal data, per-user isolation, especially for minors.
- **Right-size the engineering** — do the day-one safety/quality basics well; defer enterprise-grade machinery until scale actually demands it (see Section 11).
- **Phase it** — a great v1 beats a delayed everything.

---
*Document saved: 2026-06-20*
