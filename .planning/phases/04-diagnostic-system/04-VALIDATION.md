---
phase: 4
slug: diagnostic-system
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 04-RESEARCH.md "Validation Architecture" + "Security Domain".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest |
| **Config file** | `jest.config.ts` (root) — exists |
| **Quick run command** | `npx jest --testPathPattern="diagnostic"` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~5s quick · ~15s full (77 existing + new diagnostic tests) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="diagnostic"`
- **After every plan wave:** Run `npx jest` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

> Task IDs finalized by planner. Map below is keyed by requirement + test seam from research.
> Every seam is a pure function or mockable Server Action — automatable.

| Seam / Behavior | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|-----------------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| `derivePlacement(score)` → 2 if ≥80%, else 1 | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `normalizeFillin()` strips accents/lowercases/trims | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `gradeAnswer()` MC correct/incorrect | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `gradeAnswer()` fill-in lenient: café==cafe==Cafe | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `gradeAnswer()` blank submission always incorrect | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `gradeAnswer()` accent note when normalized match, raw differs | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `computeScore()` returns correct ratio | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `drawQuestions()` returns exactly N, no duplicates | 0 | DIAG-01 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `derivePassFail(score)` threshold at 0.8 | 0 | DIAG-02 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/scoring"` | ❌ W0 | ⬜ pending |
| `computeCooldownUntil()` adds 3 hours | 0 | DIAG-02 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ W0 | ⬜ pending |
| `isCooldownActive()` true when now < cooldown_until | 0 | DIAG-02 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ W0 | ⬜ pending |
| `formatCooldownRemaining()` "2h 14m" / "45m" | 0 | DIAG-02 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ W0 | ⬜ pending |
| `deriveIsLevelLocked()` numeric watermark: L2 locked when watermark=1 | 0 | DIAG-03 | — | N/A | unit | `npx jest --testPathPattern="lessons/level"` | extend | ⬜ pending |
| `deriveIsLevelLocked()` null watermark falls back gracefully | 0 | DIAG-03 | — | N/A | unit | `npx jest --testPathPattern="lessons/level"` | extend | ⬜ pending |
| `deriveAllLessonsComplete()` true only when all sub-components present | 0 | DIAG-03 | — | N/A | unit | `npx jest --testPathPattern="diagnostic/gating"` | ❌ W0 | ⬜ pending |
| Unlock Server Action rejects client-reported scores | 0 | DIAG-02 / SEC-05 | T-Tampering | Score recomputed from DB answers, never trusted from client | unit (mock) | `npx jest --testPathPattern="diagnostic/actions"` | ❌ W0 | ⬜ pending |
| Unlock Server Action uses admin client for profile write | 0 | DIAG-03 / SEC-05 | T-EoP | `unlocked_through_level_number` written via service_role only | unit (mock) | `npx jest --testPathPattern="diagnostic/actions"` | ❌ W0 | ⬜ pending |
| Placement Server Action blocks retake when completed attempt exists | 1 | DIAG-01 | T-EoP | One-time placement (D-P02) | unit (mock) | `npx jest --testPathPattern="diagnostic/actions"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/diagnostic/scoring.test.ts` — `computeScore`, `derivePlacement`, `derivePassFail`, `gradeAnswer`, `normalizeFillin`, `drawQuestions`
- [ ] `__tests__/diagnostic/gating.test.ts` — `computeCooldownUntil`, `isCooldownActive`, `formatCooldownRemaining`, `deriveAllLessonsComplete`
- [ ] `__tests__/diagnostic/actions.test.ts` — unlock + placement Server Action security contract (reuse mock pattern from `__tests__/lessons/actions.test.ts`)
- [ ] Extend `__tests__/lessons/level.test.ts` — add numeric-watermark cases to `deriveIsLevelLocked`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First-time user forced to placement before any lesson | DIAG-01 | Server-Component redirect gate — full-flow browser check | Fresh account → visit `/dashboard` and `/levels/french-1` → both redirect to `/diagnostic/placement` |
| Placement result places at French 1 vs French 2 | DIAG-01 | End-to-end scoring + write through real DB | Take placement, score ≥80% → French 2 active + unlocked; score <80% → French 1, French 2 locked |
| End-of-level pass unlocks next level | DIAG-03 | Cross-table write + UI lock state | Complete French 1 lessons → pass end-of-level diagnostic → French 2 card unlocks |
| Fail shows feedback + retry after cooldown | DIAG-02 | Time-based cooldown UI | Fail diagnostic → see feedback + cooldown timer → retry available after cooldown |
| Answer key never reaches client | SEC-05 | Network payload inspection | DevTools → diagnostic page RSC/network payload contains no `correct_answer` field |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
