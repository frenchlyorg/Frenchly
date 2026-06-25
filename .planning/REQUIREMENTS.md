# Frenchly — v1 Requirements

## v1 Requirements

### Authentication & Accounts

- [ ] **AUTH-01**: User can create an account with email, username, and password
- [ ] **AUTH-02**: User can log in and remain logged in across sessions (persistent session)
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: User can delete their account and all associated data from settings
- [x] **AUTH-05**: Admin/editor role exists with ability to manage lesson content via database

### Lesson Framework

- [x] **LESSON-01**: Lessons are organized into levels (French 1, French 2 for v1)
- [x] **LESSON-02**: Each lesson contains multiple trackable sub-components (granular progress)
- [x] **LESSON-03**: Student progress per sub-component is saved to the database in real time
- [x] **LESSON-04**: Level pages display: time estimate per lesson, locked/unlocked state, sub-component list

### Diagnostic & Adaptive System

- [ ] **DIAG-01**: Initial placement diagnostic runs on first use and places student at the correct level
- [ ] **DIAG-02**: End-of-level diagnostic gates advancement — student must pass to unlock the next level
- [ ] **DIAG-03**: Levels above the student's earned level are visibly locked

### Practice Problem Engine

- [x] **PROB-01**: Multiple choice problems are checked instantly by code (no AI, no cost)
- [x] **PROB-02**: Fill-in-the-blank problems are checked instantly by code
- [x] **PROB-03**: Conjugation problems are checked instantly by code
- [x] **PROB-04**: Matching problems are checked instantly by code
- [x] **PROB-05**: All auto-gradable problems show immediate right/wrong feedback with correct answer

### AI Writing Checker

- [x] **AI-01**: Open-ended writing submissions receive one concise line of feedback via Claude Haiku 4.5
- [x] **AI-02**: Prompt caching is used for grading instructions (reduces per-call cost ~90%)
- [x] **AI-03**: Per-user rate limits are enforced to prevent cost abuse
- [x] **AI-04**: If the AI checker is unavailable, the lesson continues gracefully — no crash, clear message shown
- [ ] **AI-05**: Billing alerts are configured on the Anthropic API account

### Design & UX

- [ ] **UX-01**: Light mode uses warm bone/cream surfaces with coral primary — all warm palette
- [ ] **UX-02**: Dark mode uses warm charcoal backgrounds with orange lead accent — all warm palette
- [ ] **UX-03**: Users can toggle between light and dark mode; preference is saved
- [ ] **UX-04**: Skeleton loaders display while pages and lesson content are loading
- [ ] **UX-05**: Post-lesson loading bar shows with a short encouraging message (≤8 words) as the next lesson loads
- [ ] **UX-06**: Guillemet (« ») motif is used as the active-lesson marker and decorative frame in key sections
- [ ] **UX-07**: Layout is responsive: desktop (1040px container), lesson content (720px max-width), mobile (20px side margins)
- [ ] **UX-08**: Fonts loaded: Literata (headings/logo), Be Vietnam Pro (body), Work Sans (labels)
- [ ] **UX-09**: All UI copy is sentence case
- [ ] **UX-10**: Green (tertiary color) is used exclusively for correct-answer/success feedback; nowhere else

### Content — v1

- [ ] **CONTENT-01**: French 1 lessons fully built out (grammar-focused, lighter lesson count)
- [ ] **CONTENT-02**: French 2 lessons fully built out (grammar-focused, lesson-heavy)
- [ ] **CONTENT-03**: Each lesson contains a mix of practice problem types (MC, fill-in, conjugation, matching, open writing)

### Pages & Navigation

- [ ] **PAGE-01**: Home page communicates the product clearly with a prominent "create account" call to action
- [ ] **PAGE-02**: Mission page explains the why behind the project
- [ ] **PAGE-03**: French 1 level page (adaptive, diagnostic-gated)
- [ ] **PAGE-04**: French 2 level page (lesson-heavy, diagnostic-gated)
- [ ] **PAGE-05**: User dashboard showing progress, current level, and recent activity
- [ ] **PAGE-06**: Account settings page (profile, password change, account deletion)
- [ ] **PAGE-07**: Contact/support page using frenchlyorg@gmail.com

### Security & Quality

- [ ] **SEC-01**: No API keys, tokens, or secrets appear in front-end code — server-side env vars only
- [x] **SEC-02**: Supabase Row-Level Security ensures students can only read/write their own data
- [x] **SEC-03**: All user input is sanitized; parameterized queries used throughout (no raw SQL string building)
- [ ] **SEC-04**: Rate limiting on authentication attempts (prevents brute-force attacks)
- [ ] **SEC-05**: Basic automated test suite covers the three highest-stakes paths: login, save-progress, diagnostic unlock
- [ ] **SEC-06**: All pages meet WCAG AA contrast ratios (verify coral button fill #a03e40 with tool)
- [ ] **SEC-07**: Keyboard navigation and screen-reader-friendly markup throughout
- [ ] **SEC-08**: Dependency scanning enabled (GitHub Dependabot or equivalent)

### Hosting & Deployment

- [ ] **INFRA-01**: Application deployed to Vercel, frenchly.org domain configured
- [ ] **INFRA-02**: Supabase Pro plan active (prevents auto-pause with real students)
- [ ] **INFRA-03**: Email service configured for account confirmation and password reset
- [ ] **INFRA-04**: Billing alerts set on all paid services (Vercel, Supabase, Anthropic API)

---

## v2 Requirements (Deferred)

- Streaks and personal best tracking
- Leaderboard: top 100 most active real users
- Classes: teacher-grouped leaderboards
- UI translations: Spanish + Simplified Chinese
- French 3 content
- French 4 content
- Code review process formalized (one reviewer per PR)
- Architecture diagram + ADRs maintained

## v3 Requirements (Deferred)

- French 5 / AP with French-language UI instructions
- AP French practice section
- Culture section (~10 lessons)
- Above & Beyond (slang, regional variation, real speech)
- Retry/backoff and circuit breaker around AI API

## v4 Requirements (Deferred)

- Donation page (Stripe, parents' account holder)
- AI support bot
- Fuller test pyramid: unit + integration + e2e + regression with CI thresholds

## Out of Scope (Explicitly Excluded)

- Live multiplayer (Kahoot/Blooket-style) — Phase 5, optional only if time allows
- OAuth / social login — not needed; email+password only
- HIPAA compliance — no health data collected
- Formal GDPR compliance program — US-focused; practical obligations (minimize, delete, privacy policy) covered in v1
- Chaos engineering / load testing — premature at this scale
- Heavyweight multi-tenancy — Supabase RLS handles per-student isolation
- Fake/bot leaderboard accounts — product integrity; honest empty states instead

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| AUTH-01 – AUTH-05 | Phase 2 |
| LESSON-01 – LESSON-04 | Phase 3 |
| DIAG-01 – DIAG-03 | Phase 4 |
| PROB-01 – PROB-05 | Phase 5 |
| AI-01 – AI-05 | Phase 6 |
| UX-01 – UX-10 | Phase 1 + Phase 9 |
| CONTENT-01 – CONTENT-03 | Phase 7 + Phase 8 |
| PAGE-01 – PAGE-07 | Phase 11 |
| SEC-01 – SEC-08 | Phase 2 + Phase 10 |
| INFRA-01 – INFRA-04 | Phase 12 |
