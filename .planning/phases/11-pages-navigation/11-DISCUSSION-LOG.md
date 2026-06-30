---
phase: 11-pages-navigation
date: 2026-06-30
---

# Phase 11 — Discussion Log

## Codebase Scout Findings

- Home `/` — exists (71 lines), hero + feature cards + mission teaser BUT `DisabledCTA` component is a disabled button (opacity-60, "Coming soon" tooltip). SC-1 currently fails outright. `/signup` is fully built since Phase 2.
- Mission `/mission` — exists, complete, satisfies SC-2 as-is.
- Dashboard `/dashboard` — exists with DiagnosticGate; post-placement content is a hardcoded dashed placeholder ("Your lessons are coming soon. French 1 content launches in a future update."). SC-3 fails. French 1 + 2 fully seeded since Phase 7/8.
- Account `/account` — exists: UpdatePasswordForm + DeleteAccountForm with confirmation. Satisfies SC-4 as-is.
- Level pages — exist, fully functional (Phases 3/7/8).
- Contact — does not exist anywhere. SC-5 fails. Fully net-new.
- Nav — Home/Mission/Dashboard/My account. No Contact link. Footer was removed in Phase 9 deliberately.
- Auth guard: proxy covers /dashboard /account /admin; level/lesson pages have server-side redirect guards. SC-7 already satisfied.

## Gray Areas Surfaced

4 gray areas presented. All answered without follow-up needed.

### D-01: Home CTA enablement
Q: Same CTA always vs auth-aware CTA
A: Let Claude decide
Resolved: Simple — enable button, link to /signup, no auth check on home page. Nav already covers logged-in users.

### D-02: Dashboard real data layout
Q: Level card + progress bar + lesson list vs minimal (level + bar only)
A: Level card + progress bar + recent lessons list
Resolved: Three sections: current level card, progress bar (N of M lessons), recent/completed lesson list + continue CTA.

### D-03: Contact page
Q: Static mailto vs in-app form
A: Static page with mailto: link
Resolved: Match mission page layout, mailto:frenchlyorg@gmail.com. No backend needed.

### D-04: Navigation consistency
Q: Add Contact to top nav vs add a footer
A: Add Contact to existing top nav (no footer)
Resolved: Insert Contact link after Mission in desktop + mobile nav. Visible to both logged-in and logged-out users.
