# Phase 12: Deployment & Launch — Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Get Frenchly live at frenchly.org: Vercel production deploy with the custom domain, Supabase Pro upgrade (prevents auto-pause), email service configured (transactional auth emails via Resend), billing alerts set on all paid services, and a full production smoke test confirming the end-to-end new-user flow.

This phase is predominantly manual ops — most steps happen in external dashboards (Supabase, Vercel, IONOS, Resend, Anthropic). Plans are runbooks with a few code-level changes (env vars, email template copy).

</domain>

<decisions>
## Implementation Decisions

### Email Service
- **D-01:** Use **Resend** as the SMTP provider for Supabase transactional emails. Resend is Supabase's native partner — configured entirely in Supabase SMTP settings, no code changes.
- **D-02:** Create a new Resend account in Phase 12 (does not exist yet). Sign up at resend.com, verify frenchly.org as a sending domain.
- **D-03:** From address: **noreply@frenchly.org**. Requires adding Resend DKIM/SPF TXT records to IONOS DNS for the frenchly.org domain. Do this in the same DNS session as the Vercel A/CNAME records.
- **D-04:** Resend sender domain configured via IONOS DNS (TXT records for DKIM + SPF). Same DNS edit session as the Vercel DNS flip — batch all DNS records together.

### Email Template Styling
- **D-05:** **Branded but minimal** email templates — edit in Supabase dashboard (no custom HTML). Update copy only: Frenchly name, sentence-case copy, warm tone, correct support email. No HTML/CSS customization (email clients strip CSS; not worth the effort for v1).
- **D-06:** Templates to update: **Confirm signup** and **Password reset** only. Magic link template is irrelevant (Frenchly uses email+password auth only).
- **D-07:** Confirmation email tone: **warm and direct**. Subject: "Confirm your Frenchly account". Opening: "Welcome to Frenchly! Click the link below to confirm your email and start learning French."
- **D-08:** Confirmation email body includes a **one-liner about what to expect**: "After confirming, you'll take a short placement quiz to find your level." Sets expectations, reduces confusion on first visit.
- **D-09:** Password reset email: warm tone, clear CTA. No special extras needed.

### Supabase Setup
- **D-10:** Use the **existing Supabase project** — upgrade it to Pro in-place. All 15+ migrations already applied, lesson content already seeded, RLS already configured. No re-setup required.
- **D-11:** **No test data cleanup** before going live. Dev test accounts are low-risk; lesson content (levels/lessons/sub_components) stays as-is. Real students create new accounts.
- **D-12:** Re-enable email confirmation in Supabase Auth settings (currently disabled for dev). Set to required on production.
- **D-13:** Supabase Auth URL configuration: Site URL = `https://frenchly.org`; Additional Redirect URLs includes `http://localhost:3000/auth/callback` (keeps local dev working). Both live side by side.

### Deploy Sequence
- **D-14:** **Configure-before-DNS** order to prevent public exposure of a broken site:
  1. Upgrade Supabase to Pro
  2. Set Vercel env vars (update `NEXT_PUBLIC_SITE_URL` to `https://frenchly.org`, confirm all other keys present)
  3. Sign up for Resend, add frenchly.org domain, get API key
  4. Batch all IONOS DNS records: Vercel A/CNAME + Resend DKIM/SPF TXT records
  5. Configure Supabase SMTP with Resend API key
  6. Update Supabase Auth URLs to frenchly.org (keep localhost in additional redirects)
  7. Re-enable email confirmation in Supabase Auth
  8. Update Supabase email templates (confirm signup, password reset)
  9. Manual smoke test on existing Vercel preview URL (confirm env vars, email, auth flow work)
  10. Verify frenchly.org resolves and TLS is active (Vercel auto-TLS)
  11. Full new-user smoke test on frenchly.org
  12. Set billing alerts (Vercel, Supabase, Anthropic)
- **D-15:** DNS flip happens in step 4 above — **after** Supabase Pro is active and env vars are set, but **before** SMTP/Auth config (DNS propagation takes time; configure Supabase SMTP after DNS is set so Resend can verify the domain).

### Vercel Env Vars
- **D-16:** **Audit all Vercel production env vars** — do not assume Phase 1 set them correctly. Verify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY` are all set.
- **D-17:** Update `NEXT_PUBLIC_SITE_URL` from the current Vercel preview URL to `https://frenchly.org`. This is used for password-reset redirect URLs.

### Monitoring
- **D-18:** **Vercel + Supabase built-in only** for v1. Zero additional setup. Vercel function logs + build logs + Supabase Auth logs + DB error logs cover the v1 observability needs. Add Sentry if real student error volume warrants it (v2).
- **D-19:** **Billing alerts on all three services**: Vercel (spend limit), Supabase (billing alert), Anthropic (console.anthropic.com/settings/billing — AI-05, deferred from Phase 6). All three must be set before Phase 12 is considered complete.

### Claude's Discretion
- Exact Resend SMTP credentials format for Supabase SMTP settings (host: smtp.resend.com, port: 465, username: resend, password: API key).
- Exact IONOS DNS record values (Resend provides these in their dashboard after domain setup).
- Email template copy wording for password reset (warm, sentence-case, per CLAUDE.md rule 9).
- Vercel domain configuration steps (exact UI flow in Vercel dashboard).
- Billing alert threshold values (reasonable defaults: Vercel $10, Supabase $30, Anthropic $10).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` — INFRA-01 through INFRA-04 (Vercel deploy, Supabase Pro, email service, billing alerts)
- `.planning/ROADMAP.md` — Phase 12 goal, success criteria, and Deployment Checklist section

### Project State
- `.planning/STATE.md` — Open items section (domain purchase, DNS wiring steps, frenchly.org details, IONOS note)

### Environment & Config
- `.env.example` — canonical list of env vars the app requires; use as checklist for Vercel production env audit

### Security Rules
- `CLAUDE.md` §Security Rules — no secrets in client code; all API keys server-side only (enforced in env var audit)

### Design System
- `DESIGN.md` — sentence-case, warm tone, CLAUDE.md rules 9+10 apply to email copy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.env.example` — complete list of required env vars; use as the audit checklist in D-16
- `src/app/auth/callback/route.ts` — the callback route that needs to be in Supabase's additional redirects list
- `src/lib/supabase/server.ts` — uses `SUPABASE_SECRET_KEY` (server-only); must be confirmed present in Vercel

### Established Patterns
- Supabase auth flow already handles email confirmation redirect via `/auth/callback` (Phase 2). Re-enabling email confirmation in Supabase Auth settings is sufficient — no code changes needed.
- `NEXT_PUBLIC_SITE_URL` is already referenced in the codebase for redirect URLs (from Phase 2); updating the Vercel env var is the only change needed.

### Integration Points
- **Supabase SMTP → Resend:** Supabase Settings → Auth → SMTP Settings. Configure host/port/user/pass with Resend credentials. No code change.
- **Vercel → frenchly.org:** Vercel Project → Settings → Domains. Add frenchly.org; Vercel provides the A/CNAME records to put in IONOS.
- **IONOS DNS:** Single edit session — add Vercel records + Resend DKIM/SPF TXT records together.

</code_context>

<specifics>
## Specific Ideas

- From address: `noreply@frenchly.org` (not the support Gmail — Resend can't relay Gmail as sender)
- Support email in template footers: `frenchlyorg@gmail.com`
- Confirmation email one-liner: "After confirming, you'll take a short placement quiz to find your level."
- Batch all DNS records in one IONOS session (Vercel + Resend) to minimize DNS edit trips

</specifics>

<deferred>
## Deferred Ideas

- **Sentry error monitoring** — worth adding at v2 when real student error volume exists. Zero setup needed for v1.
- **Separate dev/prod Supabase projects** — useful if dev experimentation risks corrupting prod data. Defer until it becomes a practical problem.
- **Custom HTML email templates** — v2 if branded text templates feel insufficient. Email clients strip CSS anyway.
- **Vercel Analytics** (`@vercel/analytics`) — lightweight page-view tracking. One-line setup. Consider adding in a quick v1.1 patch after launch if traffic visibility matters.

</deferred>

---

*Phase: 12-deployment-launch*
*Context gathered: 2026-06-30*
