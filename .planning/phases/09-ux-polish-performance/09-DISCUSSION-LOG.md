# Phase 9: UX Polish & Performance — Discussion Log

**Date:** 2026-06-28
**Areas discussed:** Skeleton loaders, Post-lesson flow, Guillemet active marker, Backlog: lesson layout redesign

---

## Area 1: Skeleton Loaders

| Question | Options | Selection |
|----------|---------|-----------|
| Which pages get skeletons? | Level + lesson only / Level + lesson + dashboard / All data-fetching pages | **All data-fetching pages** |
| Animation style? | Pulse / Shimmer | **Pulse (animate-pulse)** |
| Implementation approach? | loading.tsx per route / Suspense boundaries inline | **loading.tsx per route** |
| Skeleton content fidelity? | Structural match / Simplified placeholder | **Structural match** |

---

## Area 2: Post-lesson Flow

| Question | Options | Selection |
|----------|---------|-----------|
| Trigger? | Automatic on allDone / Button-triggered | **Automatic** |
| Navigate to? | Level page / Next lesson / Stay on page | **Level page** |
| Bar duration? | 1s / 1.5s / 2.5s | **1.5 seconds** |
| Initial message? | "Excellent work. Heading back." / "Well done! Loading your next lesson." / Claude picks | **"Well done! Loading your next lesson."** |
| Bar position? | Fixed top of viewport / Inline replacing lesson complete card | **Fixed top of viewport** |
| Multiple messages? | Rotate randomly / Fixed set | **Rotate randomly** |

**Message pool (5 messages, random):**
1. "Well done! Loading your next lesson."
2. "Nice job! Returning to your lessons."
3. "Lesson complete. Keep up the momentum."
4. "Très bien! Back to your level."
5. "Great work. Heading to your next lesson."

---

## Area 3: Guillemet Active-Lesson Marker

| Question | Options | Selection |
|----------|---------|-----------|
| What defines "active"? | First incomplete lesson / Most recently visited / Any with partial progress | **First incomplete lesson** |
| All lessons complete? | No marker shows / Mark last lesson | **No marker** |

---

## Area 4: Backlog — Lesson Layout Redesign

| Question | Options | Selection |
|----------|---------|-----------|
| Include in Phase 9 or defer? | Defer to v2 / Include now | **Include in Phase 9** |
| Type-grouped sections or per-item accordion? | Simple per-item accordion / Group by type with Load 5 more | **Simple per-item accordion** |
| Default open state? | First open, rest closed / All open / All closed | **First open, rest closed** |
| Auto-advance on complete? | Yes / No | **Yes — auto-collapse completed, open next** |
| Completed item behavior? | Auto-collapse + open next / Stay open | **Auto-collapse, open next** |

---

## Deferred Ideas

- Type-grouped collapsible sections with "Load 5 more" — ROADMAP backlog, deferred to v2 when lesson counts per section justify it
