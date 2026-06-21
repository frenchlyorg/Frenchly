# Frenchly — Roadmap

**Milestone:** v1.0 — Foundation & Core Product
**Target:** ~August 2026
**Status:** 1 / 12 phases complete

---

## Phase Overview

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Project Foundation | Next.js + Tailwind + design system wired up, deployable skeleton | UX-01–10 (partial) | complete ✓ 2026-06-20 |
| 2 | Authentication & Accounts | Users can sign up, log in, log out, delete account | AUTH-01–05, SEC-01–04 | in_progress (2/5 plans done) |
| 3 | Lesson Framework | Lessons with trackable sub-components; progress saved to DB | LESSON-01–04 | not_started |
| 4 | Diagnostic System | Placement diagnostic + level-gating diagnostic | DIAG-01–03 | not_started |
| 5 | Practice Problem Engine | All four auto-graded problem types working | PROB-01–05 | not_started |
| 6 | AI Writing Checker | Haiku integration, caching, rate limits, graceful fallback | AI-01–05 | not_started |
| 7 | French 1 Content | French 1 lessons + practice problems fully built | CONTENT-01, CONTENT-03 | not_started |
| 8 | French 2 Content | French 2 lessons + practice problems fully built | CONTENT-02, CONTENT-03 | not_started |
| 9 | UX Polish & Performance | Skeleton loaders, loading messages, mobile, a11y, school-device perf | UX-04–05, SEC-06–07 | not_started |
| 10 | Security & Quality | Full security audit, error handling, test suite, dep scanning | SEC-05, SEC-08 | not_started |
| 11 | Pages & Navigation | Home, Mission, Dashboard, Account Settings, Contact | PAGE-01–07 | not_started |
| 12 | Deployment & Launch | Vercel deploy, domain, Supabase Pro, email service, billing alerts | INFRA-01–04 | not_started |

---

### Phase 1: Project Foundation
**Goal:** Initialize the Next.js + Tailwind project with the full design system wired up. Both light and dark themes work. All design tokens from DESIGN.md are in Tailwind config. The site is deployable to Vercel with a home page skeleton — no auth, no lessons yet, just a working, themed, responsive shell.
**Mode:** mvp
**Requirements:** UX-01, UX-02, UX-07, UX-08, UX-09
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js, wire DESIGN.md tokens into Tailwind v4 globals.css, create ThemeProvider wrapper
- [x] 01-02-PLAN.md — Load three Google Fonts in layout.tsx, build Nav (hamburger + desktop) and ThemeToggle components
- [x] 01-03-PLAN.md — Build home page (cursor-reactive hero, feature callouts, disabled CTA), Mission stub, deploy to Vercel

**Success Criteria:**
1. `npm run dev` starts without errors
2. Home page renders in light mode with correct warm palette and Literata/Be Vietnam Pro fonts loaded
3. Dark mode toggle switches to warm charcoal + orange palette
4. Layout is responsive: 1040px container on desktop, single column with 20px margins on mobile
5. Site deploys to Vercel preview URL without build errors

---

### Phase 2: Authentication & Accounts
**Goal:** Users can create accounts, log in, stay logged in, log out, and delete their data. Student vs admin roles defined. Supabase RLS ensures per-student data isolation. No secrets in client code.
**Mode:** mvp
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, SEC-01, SEC-02, SEC-03, SEC-04
**Plans:** 5 plans

Plans:
- [x] 02-01a-PLAN.md — Foundation (static): Supabase env + client/server/admin factories, profiles/login_attempts migration SQL (RLS + trigger)
- [x] 02-01b-PLAN.md — Foundation (live): schema db push, proxy.ts session refresh + route protection, Jest Wave 0 scaffolds
- [ ] 02-02-PLAN.md — Sign-up + login + session slice: signUp/signIn actions (rate limit, vague errors), forms, pages, nav/dashboard auth state
- [ ] 02-03-PLAN.md — Logout + password reset + account deletion slice: signOut/resetPassword/deleteAccount, callback route, /account settings
- [ ] 02-04-PLAN.md — Admin role + RLS verification slice: protected /admin stub, RLS isolation test, proxy redirect test

**Success Criteria:**
1. New user can sign up with email + username + password and is redirected to dashboard
2. Returning user can log in; session persists across browser close/reopen
3. User can log out and is redirected to home page
4. User can delete account from settings; all their data is removed from DB
5. Attempting to access another student's data via direct DB query is blocked by RLS
6. Auth form shows clear error for wrong password / duplicate email
7. No API keys or Supabase service role keys appear in browser network requests

---

### Phase 3: Lesson Framework
**Goal:** The lesson data model exists in Supabase. Students can open a lesson, complete sub-components, and have their progress saved. Level pages show the correct locked/unlocked state and sub-component list per lesson.
**Mode:** mvp
**Requirements:** LESSON-01, LESSON-02, LESSON-03, LESSON-04
**Success Criteria:**
1. Lesson and sub-component schema is seeded in Supabase with sample French 1 data
2. Student can open a lesson and see its sub-components listed
3. Completing a sub-component saves progress to DB and updates the UI without page reload
4. Returning to the lesson shows previous progress correctly restored
5. Level page shows time estimates and locked/unlocked state per lesson based on student's placement

---

### Phase 4: Diagnostic System
**Goal:** First-time students take a placement diagnostic and are placed at the correct level. After completing a level, students take an end-of-level diagnostic; passing it unlocks the next level.
**Mode:** mvp
**Requirements:** DIAG-01, DIAG-02, DIAG-03
**Success Criteria:**
1. First-time user is prompted to take the placement diagnostic before accessing any lesson
2. Diagnostic result places student at French 1 or French 2 (based on score)
3. Student placed at French 1 sees French 2 as locked
4. Student who completes French 1 and passes the end-of-level diagnostic sees French 2 unlock
5. Student who fails the end-of-level diagnostic is shown feedback and can retry

---

### Phase 5: Practice Problem Engine
**Goal:** All four auto-gradable problem types (multiple choice, fill-in-the-blank, conjugation, matching) work correctly and show immediate feedback. No AI is used for these — all checked by code.
**Mode:** mvp
**Requirements:** PROB-01, PROB-02, PROB-03, PROB-04, PROB-05
**Success Criteria:**
1. Multiple choice: selecting correct answer shows green success; incorrect shows red with correct answer revealed
2. Fill-in-the-blank: correct answer (case-insensitive, accent-aware) shows success; incorrect shows correction
3. Conjugation: correct conjugation accepted; common misspellings shown the correct form
4. Matching: all pairs matched correctly shows success; incorrect pair highlighted
5. Feedback is instant (no network request for any of the four types)
6. Green success state uses tertiary color only; red error uses error color only

---

### Phase 6: AI Writing Checker
**Goal:** Students can submit open-ended French writing and receive one concise line of feedback via Claude Haiku 4.5. Prompt caching, per-user rate limits, and graceful fallback are all in place.
**Mode:** mvp
**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria:**
1. Submitting open-ended French writing returns a one-line feedback response in < 3 seconds
2. The grading system prompt is cached (verify via Anthropic API dashboard — cache hit ratio > 0 on repeat calls)
3. Submitting more than the per-user rate limit returns a friendly "you've reached your limit" message (not a crash)
4. If the Anthropic API returns an error, the lesson continues and shows "we couldn't check that right now" message
5. Billing alert email is triggered on Anthropic account (test with a low threshold)
6. Cost per check is ≤ $0.001 (verified against Anthropic usage dashboard)

---

### Phase 7: French 1 Content
**Goal:** All French 1 lessons are created with real grammar content and at least one of each problem type per lesson. The full French 1 level is completable end-to-end.
**Mode:** mvp
**Requirements:** CONTENT-01, CONTENT-03
**Success Criteria:**
1. French 1 has all planned lessons seeded with real French grammar content
2. Each lesson includes at least one MC problem, one fill-in, one conjugation or matching, and one open writing prompt
3. A student can complete all French 1 lessons and sub-components without any dead ends or broken problems
4. Time estimates on the level page are realistic (within 20% of actual completion time in manual test)

---

### Phase 8: French 2 Content
**Goal:** All French 2 lessons are created with real grammar content. French 2 is completable end-to-end after unlocking via the French 1 diagnostic.
**Mode:** mvp
**Requirements:** CONTENT-02, CONTENT-03
**Success Criteria:**
1. French 2 has all planned lessons seeded with real French grammar content (lesson-heavy level)
2. Each lesson includes at least one of each problem type including open writing
3. French 2 is only accessible after passing the French 1 end-of-level diagnostic
4. A student can complete all French 2 lessons without dead ends or broken problems

---

### Phase 9: UX Polish & Performance
**Goal:** Skeleton loaders display while content loads. Post-lesson loading bar with encouraging message appears between lessons. The site is accessible (WCAG AA), keyboard-navigable, and fast on low-powered school Chromebooks.
**Requirements:** UX-04, UX-05, UX-06, UX-10, SEC-06, SEC-07
**Success Criteria:**
1. Skeleton loaders (warm-tinted) appear on every page that fetches data before rendering
2. Post-lesson loading bar + ≤8-word message appears between completing one lesson and starting the next
3. Guillemet (« ») motif is present as the active-lesson marker on level pages
4. All pages pass WCAG AA contrast check (automated: axe or Lighthouse; manual: coral button #a03e40)
5. All interactive elements are reachable and operable via keyboard alone
6. Lighthouse performance score ≥ 85 on mobile (measured on a throttled connection)

---

### Phase 10: Security & Quality
**Goal:** Full security pass — input sanitization audit, error handling, graceful degradation, dependency scanning active, basic test suite green for the three critical paths.
**Requirements:** SEC-05, SEC-08
**Success Criteria:**
1. Automated tests pass for: login flow, save-progress flow, diagnostic-unlock flow
2. Dependency scanning (Dependabot or equivalent) is active and has run at least once with no critical vulnerabilities unaddressed
3. Manual audit confirms no raw SQL string building anywhere in the codebase
4. All API route handlers return appropriate error responses (not 500 crashes) when given malformed input
5. If Supabase is unavailable, the UI shows a graceful error state — not a broken blank page

---

### Phase 11: Pages & Navigation
**Goal:** All supporting pages exist and are polished: Home (strong CTA), Mission, Dashboard (progress + level), Account Settings, and Contact. Navigation between all pages is smooth.
**Requirements:** PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07
**Success Criteria:**
1. Home page clearly communicates what Frenchly is and has a prominent "Get started" / "Create account" button above the fold
2. Mission page exists with the project's why
3. Dashboard shows student's current level, completed lessons, and progress bar toward next level
4. Account settings page allows password change and account deletion (with confirmation)
5. Contact page links to frenchlyorg@gmail.com
6. All pages are linked in a consistent navigation header and/or footer
7. A logged-out visitor cannot access dashboard or lesson pages (redirect to home/login)

---

### Phase 12: Deployment & Launch
**Goal:** Frenchly is live at frenchly.org with Supabase Pro active, email service configured, all billing alerts set, and the product ready for real students.
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria:**
1. frenchly.org loads the production app over HTTPS (Vercel auto-TLS)
2. Supabase Pro is active — project does not auto-pause
3. Email service sends account confirmation and password reset emails successfully (manual test)
4. Billing alerts are set on Vercel, Supabase, and Anthropic accounts
5. A complete new-user flow works on production: sign up → diagnostic → French 1 lesson → save progress → log out → log in → progress restored
6. No console errors or broken assets on production

---

## Milestone Backlog (Future)

### Milestone 2: Motivation & Growth
- Streaks + personal bests
- Leaderboard (real users, top 100 active)
- Classes (teacher-grouped leaderboards)
- French 3
- French 4
- UI translations: Spanish + Simplified Chinese

### Milestone 3: Advanced Content
- French 5 / AP (French-language UI instructions)
- AP French practice section
- Culture section (~10 lessons)
- Above & Beyond (slang, regional variation)

### Milestone 4: Sustain
- Donation page (Stripe, parents' account)
- AI support bot
- Fuller test pyramid + CI coverage thresholds
- Architecture diagram + ADRs

### Milestone 5: Optional
- Live multiplayer (Kahoot/Blooket-style lobbies)
