# Phase 12: Deployment & Launch — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 12-deployment-launch
**Areas discussed:** Email service, Email template styling, Error monitoring, Supabase project (same vs new), Deploy sequence, Vercel env vars

---

## Email Service

| Option | Description | Selected |
|--------|-------------|----------|
| Resend | Supabase native SMTP partner. Free: 3k/month. Configured in Supabase dashboard, no code. | ✓ |
| Postmark | Best deliverability. Free: 100/month then paid. Overkill for v1. | |
| SendGrid | Most widely known. No Supabase native integration. More complex. | |

**User's choice:** Resend
**Notes:** Account does not exist yet — create in Phase 12. From address: noreply@frenchly.org. Requires Resend DKIM/SPF TXT records in IONOS DNS.

---

## Resend Sender Domain

| Option | Description | Selected |
|--------|-------------|----------|
| Add Resend DNS records via IONOS | Standard setup. TXT records for DKIM + SPF. Same session as Vercel DNS flip. | ✓ |
| Use Resend's default domain | Ship from onboarding@resend.dev. Unprofessional, lower deliverability. | |

**User's choice:** IONOS DNS records (batch with Vercel DNS in same session)

---

## Email Template Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Branded but minimal | Edit Supabase templates: Frenchly name, sentence-case copy, warm tone. No custom HTML. ~10 mins. | ✓ |
| Custom HTML templates | Full palette + typography in HTML email. High maintenance, email clients strip CSS. | |
| Supabase defaults | Generic templates. Works but feels unpolished. | |

**User's choice:** Branded but minimal

---

## Which Email Templates

**User's choice:** Confirm signup + Password reset (Magic link excluded — Frenchly uses email+password only)

---

## Email Copy Tone

| Option | Description | Selected |
|--------|-------------|----------|
| Warm and direct | Subject: "Confirm your Frenchly account". Clear, matches app voice. | ✓ |
| Playful French flair | Bienvenue subject, French word in opening. Risks feeling gimmicky. | |

**User's choice:** Warm and direct

---

## Confirmation Email Extras

| Option | Description | Selected |
|--------|-------------|----------|
| Link + one-liner | "After confirming, you'll take a short placement quiz to find your level." | ✓ |
| Link only | Minimal. No extras. | |

**User's choice:** One-liner included — sets expectations, reduces confusion at first visit

---

## Error Monitoring

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel + Supabase built-in only | Zero setup. Covers v1 needs. Add Sentry at v2 if needed. | ✓ |
| Sentry | Stack traces, alerts, session replay. Worth it at ~100+ DAU. | |
| Vercel Analytics | Page views / Web Vitals. One-line setup, no error tracking. | |

**User's choice:** Vercel + Supabase built-in only

---

## Billing Alerts

**User's choice:** All three services — Vercel, Supabase, Anthropic

---

## Supabase Project

| Option | Description | Selected |
|--------|-------------|----------|
| Same project, upgrade to Pro | All migrations applied, lesson content seeded, RLS configured. Zero re-setup. | ✓ |
| Separate production project | Clean slate. Must re-run 15+ migrations + re-seed all content. High effort. | |

**User's choice:** Same project, upgrade in-place

---

## Test Data Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Wipe test user rows | Clean start for real students. Delete dev accounts + progress. | |
| Ship as-is | Dev accounts are low-risk. Real students create new accounts. | ✓ |

**User's choice:** Ship as-is — no cleanup needed

---

## Deploy Sequence

| Option | Description | Selected |
|--------|-------------|----------|
| Configure → test → flip DNS | Safe. DNS is last step. No public exposure of broken state. | ✓ |
| DNS first, then configure | DNS live immediately. Risk of users hitting broken state during config. | |

**User's choice:** Configure before DNS flip

---

## Localhost in Supabase Redirects

**User's choice:** Keep localhost:3000/auth/callback in Supabase Additional Redirect URLs after switching Site URL to frenchly.org. Dev remains unaffected.

---

## Vercel Env Vars

| Option | Description | Selected |
|--------|-------------|----------|
| Audit all vars | Verify all 4 keys present + update NEXT_PUBLIC_SITE_URL to https://frenchly.org. | ✓ |
| Only update NEXT_PUBLIC_SITE_URL | Trust Phase 1 setup. Risky — could miss a missing key. | |

**User's choice:** Full audit — don't assume Phase 1 set everything correctly

---

## Claude's Discretion

- Exact Resend SMTP credentials for Supabase settings
- IONOS DNS record values (provided by Resend dashboard after domain setup)
- Password reset email copy (warm, sentence-case)
- Vercel domain configuration UI steps
- Billing alert threshold values (suggested: Vercel $10, Supabase $30, Anthropic $10)

## Deferred Ideas

- **Sentry** — add at v2 when real student error volume exists
- **Separate dev/prod Supabase projects** — when dev experimentation risks prod data
- **Custom HTML email templates** — v2
- **Vercel Analytics** — lightweight, consider as v1.1 patch after launch
