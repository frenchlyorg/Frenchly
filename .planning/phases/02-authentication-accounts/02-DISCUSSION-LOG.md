# Phase 2: Authentication & Accounts — Discussion Log

**Date:** 2026-06-20
**Areas discussed:** Email verification, Post-auth redirects, Error & feedback UX, Account deletion, Admin role, Rate limiting

---

## Email Verification

| Question | Options | Decision |
|----------|---------|----------|
| Immediate access or verify first? | Immediate / Verify before access | Immediate access — reduces friction for students |
| Sign-up fields? | Email+password+username / Email+password only | Email + password + username (AUTH-01) |
| Password requirements? | 8 chars / 8+ with number+symbol / You decide | 12 chars + one number (user-specified) |
| Password reset in Phase 2? | Include / Defer | Include in Phase 2 |
| Username rules? | Letters/numbers/underscores / Any characters | Letters/numbers/underscores + profanity filter (including bypass patterns like "nigha", "sh!tter") |

---

## Post-auth Redirects

| Question | Options | Decision |
|----------|---------|----------|
| After sign-up, where? | /dashboard stub / Home / Onboarding | /dashboard stub |
| After logout, where? | / (home) / /login | / (home page) |
| Unauthenticated /dashboard visit? | Redirect to /login / Show message | Redirect to /login, then back after login |
| Logged-in nav? | Username + Log out / Dashboard + avatar / You decide | Replace "Log in" with username + "Log out" link |

---

## Error & Feedback UX

| Question | Options | Decision |
|----------|---------|----------|
| Where do errors appear? | Inline under field / Top of form / Both | Inline under each field |
| Error copy tone? | Plain and specific / Warm and encouraging / You decide | Warm and encouraging |
| Login failure copy? | Vague "Email or password incorrect" / Specific per error | Vague — prevents account enumeration |

---

## Account Deletion

| Question | Options | Decision |
|----------|---------|----------|
| Confirmation method? | Type "delete" / Password re-entry / Simple dialog | Type "delete" in text input |
| What gets deleted? | Everything immediately / Soft-delete | Soft-delete (flag + anonymize PII, purge job later) |

---

## Admin Role

| Question | Options | Decision |
|----------|---------|----------|
| Admin login entry point? | Same /login / Separate /admin/login | Same /login, role detected after |
| Phase 2 admin scope? | DB flag + stub / Full content management UI | DB flag + /admin stub only |

---

## Rate Limiting

| Question | Options | Decision |
|----------|---------|----------|
| Failed attempts before lockout? | 5 attempts/15min / 3 attempts+CAPTCHA / Supabase default | 5 attempts → 15-minute lockout |

---

## Claude Discretion Items

- Profanity filter: `bad-words` npm package + custom bypass list (common leetspeak substitutions)
- GDPR hard-delete requirement flagged for Phase 12 — soft-delete is not sufficient for GDPR Article 17 compliance without a scheduled purge job
- Input focus state: coral bottom border per DESIGN.md input spec
