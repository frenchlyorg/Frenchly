---
phase: 09-ux-polish-performance
plan: 03
type: execute
status: complete
completed: 2026-06-28
---

# 09-03 Summary — WCAG AA + Lighthouse Audit

## Outcome: PASS

Phase 9 audit completed via human-run Chrome Lighthouse (mobile) on the level page.

### Lighthouse results (level page, mobile)

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Performance | 91 | ≥ 85 | ✓ |
| Accessibility | 98 | no new violations | ✓ |
| First Contentful Paint | 0.8 s | — | ✓ green |
| Largest Contentful Paint | 3.3 s | — | ⚠ orange (see below) |
| Total Blocking Time | 170 ms | — | ✓ green |
| Cumulative Layout Shift | 0 | — | ✓ green |
| Speed Index | 1.1 s | — | ✓ green |

### Key findings

- **CLS = 0** — the skeleton structural-match constraint (D-SK-04) worked exactly as designed. The Phase 9 additions (skeletons, accordion, post-lesson bar, active-lesson dot) introduced **zero layout shift**.
- **Accessibility 98** — no new violations from accordion ARIA, progressbar roles, or skeleton aria-hidden. Coral button contrast passes (Lighthouse contrast audit would have flagged a <4.5:1 pairing; it did not).
- **LCP 3.3 s (orange)** — the only non-green metric. Root cause is framework/font defaults (render-blocking requests ~150 ms, legacy JS ~13 KiB, unused JS ~23 KiB), **not** Phase 9 work. Measured on localhost prod build (no CDN, no Brotli); Vercel edge compression typically reduces LCP ~1 s. Deferred as a future optimization, out of Phase 9 scope.

### Automated pre-checks (Task 1)

- `npm test` — 18 suites, 156 passed, 3 skipped ✓
- `npm run build` — clean, no type errors ✓
- ARIA contract: `aria-expanded`, `role="progressbar"`, `role="region"` all present ✓
- No nested interactive elements (explainer "Mark complete" lives in content region) ✓
- No tertiary/green tokens in Phase 9 additions ✓

## Out-of-plan UX polish (same session, user-requested)

Bundled into Phase 9 while the developer reviewed the build:
- Global site footer (Frenchly / © 2026) in root layout
- Loader spinner on action buttons (auth forms + diagnostic CTA) via Spinner + LinkButton
- Email password-reset request flow (`/forgot-password` + ForgotPasswordForm) wiring the existing `resetPassword` action
- Active-lesson marker changed from « guillemet to coral dot (user preference)
- Level-card progress bars + "Completed" state
- Explainer completion marker: dash → check outline
- Home page: removed decorative guillemets + duplicate footer

## Follow-ups (not blocking)

- LCP optimization (font preload / render-blocking) — revisit if Vercel prod LCP stays orange
- SMTP config in Supabase so reset emails actually send (already on Phase 12 deploy checklist)
- Optional: remove faint «» hero watermark if the no-guillemet preference extends there
