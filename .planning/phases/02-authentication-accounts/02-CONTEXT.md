---
phase: "02-authentication-accounts"
phase_number: "2"
gathered: "2026-06-20"
status: "ready_for_planning"
---

# Phase 2: Authentication & Accounts — Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts, log in with persistent sessions, log out, delete their accounts, and reset forgotten passwords. An admin role exists (DB flag + protected stub). No lesson content yet — dashboard is a stub. Supabase Auth + RLS is the backend. No secrets in client code.

**In scope:** Sign-up, login, logout, password reset, account deletion, admin role flag + stub, /dashboard stub, protected routes, nav updates for auth state, profanity filter on usernames.

**Out of scope (future phases):** Lesson progress (Phase 3+), diagnostic (Phase 4+), admin content management UI (Phase 7+), social login / OAuth (not planned for v1).
</domain>

<decisions>
## Implementation Decisions

### Sign-up Form
- **D-01:** Email verification is **NOT required** before accessing lessons. Users sign up and land immediately on /dashboard. Reduces friction for high school students.
- **D-02:** Sign-up fields: **email + password + username** (per AUTH-01). All three required.
- **D-03:** Password minimum: **12 characters + at least one number**. Enforced server-side (Supabase Auth custom policy).
- **D-04:** **Password reset is in Phase 2 scope.** Supabase sends a reset email; user clicks link, sets new password. Standard `supabase.auth.resetPasswordForEmail()` flow.
- **D-05:** Username rules: **letters, numbers, underscores only. Min 3, max 20 chars.** No spaces. Server-side profanity filter required — use `bad-words` npm package plus a custom bypass list covering patterns like `nigha`, `sh!tter`, `b1tch`, etc. Username uniqueness enforced in DB (unique constraint).

### Post-auth Redirects
- **D-06:** After sign-up → `/dashboard` (stub: shows username, welcome message, placeholder for lesson progress).
- **D-07:** After login → `/dashboard`.
- **D-08:** After logout → `/` (home page). Nav updates to show "Log in" again.
- **D-09:** Unauthenticated access to `/dashboard` or any protected route → redirect to `/login`. After successful login, redirect back to the originally-requested page.
- **D-10:** Logged-in nav replaces "Log in" with **username + "Log out" link**. (Avatar/icon can come in Phase 9 polish.)

### Error & Feedback UX
- **D-11:** Auth errors appear **inline under each field** (not a top-of-form banner). e.g., email field shows "Hmm, that email's taken — already a Frenchly member?" below it.
- **D-12:** Tone is **warm and encouraging**, not clinical. Examples:
  - Email taken: "Hmm, that email's taken — already a Frenchly member?"
  - Username taken: "That username is gone — try adding your initial or a number."
  - Username profanity violation: "That username isn't available. Try something else."
  - Password too short: "Make it at least 12 characters with a number — your account will thank you."
- **D-13:** Login failure uses **vague copy** for security: "Email or password incorrect." (Prevents account enumeration — attacker can't tell if email exists.)

### Account Deletion
- **D-14:** Deletion confirmation: user must **type "delete"** in a text input to confirm. Button stays disabled until the field matches.
- **D-15:** **Soft-delete:** set `deleted_at` timestamp on the user record + anonymize PII (null out email, username). Lesson progress rows remain but are orphaned. A background purge job (Phase 10/12) hard-deletes records after 30 days.
  - ⚠ GDPR note: GDPR Article 17 requires hard-deletion within 30 days of user request. The purge job is not optional — it must be built before launch (Phase 12 at the latest).

### Admin Role
- **D-16:** Admin uses the **same /login form** as students. After login, server detects `role='admin'` in the DB and redirects to `/admin` instead of `/dashboard`.
- **D-17:** Phase 2 admin scope: **role='admin' field in users table + protected `/admin` route** with a stub page ("Admin area — content management coming soon"). Full content management UI is Phase 7+.
- **D-18:** Admin role is assigned manually in the DB by the developer (no self-service admin promotion in v1).

### Rate Limiting
- **D-19:** **5 failed login attempts → 15-minute lockout** for that email. Enforced server-side (Next.js API route middleware or Supabase Auth settings). After lockout expires, counter resets.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `DESIGN.md` — All color tokens, typography, spacing. Auth forms follow the same warm palette. Input fields per design rules: lightly boxed (not underlined), focus state = thicker coral bottom border.
- `CLAUDE.md` — Project conventions: security rules (SEC-01: no secrets in client), design system rules, file structure.

### Requirements
- `.planning/REQUIREMENTS.md` AUTH-01–05 — Full auth requirements. Phase 2 covers all five.
- `.planning/REQUIREMENTS.md` SEC-01–04 — Security requirements. SEC-01 (no client secrets), SEC-02 (RLS), SEC-03 (parameterized queries), SEC-04 (rate limiting) all in Phase 2.
- `.planning/ROADMAP.md` Phase 2 — Goal statement and 7 success criteria.

### Prior Phase Context
- `.planning/phases/01-project-foundation/01-CONTEXT.md` — Established patterns: TypeScript strict, Tailwind v4 CSS-first, warm palette, Nav structure.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 1)
- `src/components/nav.tsx` — Has "Log in" link to `/login`. Phase 2 must update to show username + "Log out" when authenticated. Auth state detection goes here.
- `src/components/theme-provider.tsx` — Client wrapper pattern. Auth context will follow the same pattern.
- `src/app/globals.css` — All color tokens available. Input focus state token: `--color-primary` (coral `#a03e40`) for border.
- `src/app/layout.tsx` — Root layout wraps all pages. Auth session provider should be added here.

### Established Patterns
- **"use client" wrapper for third-party providers** — same pattern used for ThemeProvider should be used for Supabase auth context.
- **Server Components by default** — only add "use client" where needed (forms, auth state reads).
- **Route: `/login`** — Nav "Log in" already links here. Phase 2 builds this page.

### Integration Points
- `src/components/nav.tsx` — Must conditionally show username + logout vs. "Log in" based on session state.
- `src/app/layout.tsx` — Session provider wraps children here.
- `/dashboard` — New protected route, stub content only in Phase 2.
- `/admin` — New protected route, admin-only stub in Phase 2.
</code_context>

<deferred_ideas>
## Noted for Later

- **OAuth / social login** (Google, GitHub) — Not in v1. Could add in a future phase if demand exists.
- **Avatar/profile photo** — Phase 9 polish. Nav shows username text only in Phase 2.
- **Admin content management UI** (lesson editor, student management) — Phase 7+.
- **Email verification** — Deferred indefinitely. May reconsider if spam accounts become a problem post-launch.
- **Hard purge job for deleted accounts** — Must be built before launch (Phase 12 at the latest) for GDPR compliance.
</deferred_ideas>
