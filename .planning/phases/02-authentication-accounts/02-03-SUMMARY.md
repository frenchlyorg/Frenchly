---
phase: 02-authentication-accounts
plan: "03"
subsystem: auth-lifecycle
tags: [auth, signout, password-reset, account-deletion, pii-anonymization, soft-delete]
dependency_graph:
  requires: ["02-02"]
  provides: ["signOut", "resetPassword", "deleteAccount", "auth-callback-route", "account-settings-page"]
  affects: ["src/app/auth/actions.ts", "src/components/nav.tsx (signOut already wired)"]
tech_stack:
  added: []
  patterns:
    - "Server Action: signOut via supabase.auth.signOut() then redirect('/')"
    - "Server Action: resetPassword with anti-enumeration vague response"
    - "Server Action: deleteAccount resolves user via getUser server-side; uses admin client for PII anonymization + soft-delete"
    - "Route Handler: GET /auth/callback exchanges code via exchangeCodeForSession, redirects to /account/update-password"
    - "Client Component: DeleteAccountForm with controlled confirmation input (exact 'delete' match gate)"
    - "Client Component: UpdatePasswordForm with show/hide toggles + supabase.auth.updateUser"
    - "Server Component: /account with getUser guard + redirect('/login')"
key_files:
  created:
    - src/app/auth/callback/route.ts
    - src/components/auth/DeleteAccountForm.tsx
    - src/components/auth/UpdatePasswordForm.tsx
    - src/app/account/page.tsx
    - src/app/account/update-password/page.tsx
  modified:
    - src/app/auth/actions.ts
    - __tests__/auth/logout.test.ts
    - __tests__/auth/delete.test.ts
decisions:
  - "deleteAccount uses admin client for profiles UPDATE — column grant on profiles blocks user-context client from setting deleted_at (SECURITY)"
  - "resetPassword always returns 'If that email is registered, you'll receive a reset link.' — prevents email enumeration (T-02-16)"
  - "admin.deleteUser(id, true) with shouldSoftDelete=true — marks auth.users.deleted_at so Supabase rejects all future logins (Pitfall 6 / T-02-17)"
  - "deleteAccount resolves user id via getUser() server-side — never accepts a client-supplied id (T-02-15)"
  - "DeleteAccountForm confirmation is case-sensitive exact match to 'delete' (no trim on comparison, only on display)"
metrics:
  duration_seconds: 330
  completed_date: "2026-06-21"
  tasks_completed: 2
  files_created: 5
  files_modified: 3
---

# Phase 2 Plan 3: Account Lifecycle (signOut, password reset, delete) Summary

**One-liner:** signOut + resetPassword + deleteAccount server actions with PII anonymization via admin client, password-reset callback route, and /account settings page with type-"delete" confirmation gate.

---

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | signOut, resetPassword, deleteAccount + callback route | 0954994 | src/app/auth/actions.ts, src/app/auth/callback/route.ts, __tests__/auth/logout.test.ts, __tests__/auth/delete.test.ts |
| 2 | /account page + DeleteAccountForm + UpdatePasswordForm | 4e6dc00 | src/components/auth/DeleteAccountForm.tsx, src/components/auth/UpdatePasswordForm.tsx, src/app/account/page.tsx, src/app/account/update-password/page.tsx |

---

## Verification

- `npx jest --testPathPattern="auth/(logout|delete)"` — 9 tests passing
- `npx jest` — 54 tests passing, 3 pre-existing live-DB skips unchanged
- `npx tsc --noEmit` — exits 0

---

## Security Mitigations Implemented

| Threat ID | Mitigation |
|-----------|-----------|
| T-02-15 | deleteAccount resolves id via getUser() server-side — no client-supplied id accepted |
| T-02-16 | resetPassword always returns the same vague message regardless of email existence |
| T-02-17 | admin.deleteUser(id, true) soft-deletes auth user; profiles PII anonymized before that |
| T-02-18 | callback/route.ts validates code via exchangeCodeForSession; invalid → /login?error=invalid-reset-link |
| T-02-19 | createAdminClient never imported into any "use client" file; used only in server action |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all functionality is fully wired.

---

## Self-Check: PASSED

Files exist:
- FOUND: src/app/auth/actions.ts
- FOUND: src/app/auth/callback/route.ts
- FOUND: src/components/auth/DeleteAccountForm.tsx
- FOUND: src/components/auth/UpdatePasswordForm.tsx
- FOUND: src/app/account/page.tsx
- FOUND: src/app/account/update-password/page.tsx
- FOUND: __tests__/auth/logout.test.ts
- FOUND: __tests__/auth/delete.test.ts

Commits exist:
- FOUND: 0954994 (Task 1)
- FOUND: 4e6dc00 (Task 2)
