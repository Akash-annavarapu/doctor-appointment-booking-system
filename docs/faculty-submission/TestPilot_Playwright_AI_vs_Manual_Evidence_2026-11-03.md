# TestPilot — Playwright execution and AI-versus-manual evidence

**Evidence audit:** 3 November 2026  
**Course:** BITS Pilani WILP, BSDCH ZC229T — Design Project  
**Project:** TestPilot — AI-Assisted Test Case Generation for a Full-Stack Healthcare Platform  
**Status:** Technical execution evidence VERIFIED; comparative design audit RECORDED (preliminary/unsigned); independent human approval **NOT VERIFIED**.

## Executive result

The two requested milestones have verifiable technical evidence:

1. **Gemini scenario intent → source-reviewed Playwright:** Four *genuine* US-017 Gemini candidate intents from 26 October have been translated into four fixed, auditable API tests that passed on an isolated localhost healthcare stack. This is **not** automatic execution of arbitrary generated code, nor does it prove a separately signed human reviewer approved them in the current Lab.
2. **AI versus manual comparison:** An archived 26 October preliminary design audit covers **12 Gemini candidates versus 13 manual baseline cases** over US-001, US-005, US-017. Under an explicit-assertion acceptance-criterion rule, AI covers **4/6 (66.7%)** and manual designs **6/6 (100%)** of the six *selected* criteria. These values are an **unsigned preliminary assessment, not independent reviewer ratings or execution pass rates**.

A reproducible audit now checks these counts against the unchanged 36-case catalog, the source user stories, four redacted original Gemini US-017 cases, and the Playwright test IDs:

```bash
node testpilot-lab/observedEvidence.js
node --test testpilot-lab/tests/observedEvidence.test.js
```

The audit is offline and does **not** execute any model calls, update the database, or re-run GitHub Actions.

## A. Source and execution evidence chain

| Step | Evidence | Provenance and limit |
| --- | --- | --- |
| 1. Original generation | [Redacted genuine US-017 Gemini export](../../testpilot-lab/evidence/gemini-us-017-2026-10-26.redacted.json) | Original Team Lab export inspected 2026-10-26 18:35:17 UTC; AI-001–AI-004 were originally `NOT_RUN` and `reviewed: false`; signed short-lived receipt omitted |
| 2. Technical source review | [Week 7 technical adaptation record](../WEEK7_GEMINI_PLAYWRIGHT_EVIDENCE.md) | Adapted invalid `DOC-123`, `slotTime` and expired date to valid fixture IDs, `appointmentDate`, `appointmentTime` and a future test date; no independently signed approval claimed |
| 3. Reviewed fixed test code | [Playwright generated-booking API test](../../e2e/tests/generated-booking.api.spec.cjs) | Four `AI-###` titles map to fixed assertions; source-derived US-018 concurrency test is separate and **not Gemini generated** |
| 4. Isolation | [CI workflow](../../.github/workflows/testpilot-ci.yml) | Node 22, MongoDB 7 service, `NODE_ENV=test`, `TESTPILOT_ISOLATED_API=1`, localhost healthcare API; no production patient data or live bookings |
| 5. Measured execution | [GitHub Actions run 41327612679](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/41327612679) | 1 November 2026, commit `042e14ae70049113404983e28ece5409592154e0`; Playwright main suite **29 PASS, 1 SKIP, 0 FAIL**, three workflow jobs successful |
| 6. Separate recipe-engine verification | Same run, `reviewed-dynamic.api.spec.cjs` job step | **6 PASS**, but runs the labeled `SYNTHETIC-CI-FIXTURE-NOT-A-HUMAN`; it does **not** constitute human approval or real model output |

### Real Gemini US-017: case-by-case execution

| Original generated ID | Category | Fixed, tested assertion (source reviewed) | Playwright result |
| --- | --- | --- | --- |
| AI-001 | Positive | POST with valid synthetic doctor and slot returns HTTP 201; exactly one `Pending` appointment | **PASS** |
| AI-002 | Negative | Occupied slot returns HTTP 409; no duplicate active booking | **PASS** |
| AI-003 | Negative | Required booking fields missing → HTTP 400 and zero inserts | **PASS** |
| AI-004 | Security | Unauthenticated booking → HTTP 401 and zero inserts | **PASS** |

The additional `US-018` concurrency assertion also passed, but is based on documented requirements rather than Gemini. The registration and doctor-directory API tests in `story-category.api.spec.cjs` are **source-derived**, not AI-generated. **Never sum these as additional successful Gemini cases.**

The original Gemini output was initially `NOT_RUN`; the four *reviewed implementation assertions* later passed in isolated CI. A test title matching an AI ID establishes traceability of the **scenario intent**, not verbatim execution of every generated step.

## B. AI versus manual case-design comparison

### Data provenance and measurement rule

The 26 October archival study reports four generated candidates per story (12 total). The manually authored baseline is [manual-baseline.json](../../testpilot-lab/manual-baseline.json): US-001 = TP-001–TP-006 (6), US-005 = TP-011–TP-013 (3), US-017 = TP-023–TP-026 (4), together 13 of the 36 project-wide manual cases.

A criterion is marked *covered* **only if** the planned steps **and expected result** explicitly support it. Merely mentioning a topic, calling an endpoint, or receiving HTTP 200 is insufficient. The 26 October study used an assistant's provisional technical judgment. Reviewers must inspect the raw AI steps and detailed manual assertions before final acceptance.

| Story / use case | Gemini cases | Manual cases | AI criteria | Manual criteria |
| --- | ---: | ---: | ---: | ---: |
| US-001 / UC-01 — Patient registration | 4 | 6 | 2 / 2 | 2 / 2 |
| US-005 / UC-04 — Approved doctor browsing | 4 | 3 | 0 / 2 | 2 / 2 |
| US-017 / UC-09 — Appointment booking | 4 | 4 | 2 / 2 | 2 / 2 |
| **Total (selected criteria)** | **12** | **13** | **4 / 6 = 66.7%** | **6 / 6 = 100%** |

**Denominator:** six documented acceptance criteria selected across these stories; NOT 12 or 13 test cases. **Difference:** 33.3 percentage points on this narrow preliminary design rubric, with no inferential or general-superiority claim.

### Acceptance-criterion-level review ledger

| Story | Source acceptance criterion | AI design | Manual design | Evidence-based reason |
| --- | --- | --- | --- | --- |
| US-001 | Valid unique details create account and JWT | Covered | Covered | Both contain positive registration expectations; AI example phone data may be invalid and needs correction |
| US-001 | Missing fields or short password rejected | Covered | Covered | Both explicitly plan these negatives |
| US-005 | Only approved doctors appear | **Not covered** | Covered | AI steps describe listing/filtering, but expected output does not explicitly exclude pending doctors; TP-011 targets this |
| US-005 | Empty list handled clearly | **Not covered** | Covered | Gemini did not explicitly assert empty array/clear empty-state behavior; TP-012 targets this |
| US-017 | Valid booking creates Pending appointment | Covered | Covered | Gemini AI-001 and TP-023 plan the status transition; fixed isolated check passed |
| US-017 | Unavailable times rejected | Covered | Covered | Gemini AI-002 and TP-026 cover an occupied slot; not all unavailable-time variants |

### Qualitative accuracy, coverage gaps, and improvements

- **US-001:** Gemini returned 4 candidate cases (successful registration, missing required fields, short password, duplicate email). Manual designs additionally specify exactly-eight-character boundary, normalized email collision, and Indian 10-digit mobile validation. Example model phone data may confound an otherwise valid registration case. No claim that all manually designed cases were executed.
- **US-005:** Gemini produced listing, approved-only, empty-catalog, and unsupported-method suggestions, but failed to make two central oracle assertions explicit. A basic public GET 200 probe is **not** sufficient proof of approved-only filtering or a correct empty state. The manual baseline also has an invalid-ObjectId case.
- **US-017:** Gemini identified valid booking, occupied-slot conflict, missing fields and unauthorized access. It **missed** two manual edge/negative priorities: booking outside working hours (TP-024) and concurrent booking collision (TP-025). The source-derived edge check covers concurrency in CI but does not change what Gemini originally proposed. The output also used a placeholder `doctorId` and a mismatched `slotTime` field; fixed tests use correct backend inputs.

**Quality-score status:** No genuine independent reviewer 1–5 ratings for completeness, accuracy, or healthcare relevance have been verified. **Do not invent or publish numeric human scores.** This qualitative technical review identifies concrete strengths/weaknesses but is not a substitute for the two independent raters specified in the evaluation protocol.

## C. Repeatable demonstration for the mentor

1. Show the unmodified archived Gemini US-017 case IDs `AI-001…AI-004` and their original `NOT_RUN` statuses. Explain the short-lived receipt was intentionally redacted.
2. Open `e2e/tests/generated-booking.api.spec.cjs` and point out the same IDs in the four hard-coded Playwright test names and their real assertions.
3. Open [the successful 1 November CI run](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/41327612679), choose **Playwright Chromium + isolated generated-case API tests**, and inspect the passing `AI-001`–`AI-004` tests; show `29 passed, 1 skipped` separately from the `6 passed` synthetic-recipe step.
4. Open the redacted source export and `testpilot-lab/observed-case-comparison.json`; run `node testpilot-lab/observedEvidence.js` to recalculate 4/6 versus 6/6 without invented ratings.
5. Explain Gemini's missing concurrency/out-of-hours cases, bad placeholder inputs, and incomplete doctor-listing oracles; do not imply all 12 AI cases executed or passed.
6. Show the independent human review panel in TestPilot Lab; two actual reviewers must confirm the missing assertions, score quality, resolve disputes, and export reviewed evidence.

## D. Boundaries and final sign-off

**Technically verified now:** four original Gemini scenario intents executed by source-reviewed fixed Playwright tests against a synthetic isolated API; 29 main Playwright PASS and one deliberately skipped guard in the verified 1 November run; separate six-case synthetic recipe executor PASS; reproducible preliminary comparative analysis.

**Not yet independently validated:** exact US-001/US-005 original raw exports in this repository, all ten genuine Gemini prompt experiments, signed human approval of case-to-recipe mappings, two independent reviewers' coverage judgments, 1–5 quality scores, and peer usability sessions. Keep faculty readiness marked **INCOMPLETE** until their genuine exports are validated.

**Human reviewer record to collect (do not prefill):**

| Reviewer | Story / case IDs checked | Approved mapping? | 1–5 quality ratings and evidence | Review date / sign-off |
| --- | --- | --- | --- | --- |
| Reviewer A | ___ | ___ | ___ | ___ |
| Reviewer B | ___ | ___ | ___ | ___ |

After reviewer validation, regenerate the final submitted report's empirical section. The repository's existing `testpilot-lab/studySummary.js` requires actual signed Lab comparison exports and does not accept this preliminary audit as a substitute.

**Artifact retention:** Playwright report artifact for run 41327612679 was published 1 November 2026 and is scheduled to expire **15 November 2026 UTC**. Download and retain it for submission; URLs to old artifacts may not work indefinitely.

## Sources for reproduction

- [Original redacted Gemini output](../../testpilot-lab/evidence/gemini-us-017-2026-10-26.redacted.json) — signed receipt removed; original-file SHA-256 in header
- [Structured preliminary comparison](../../testpilot-lab/observed-case-comparison.json) and [auditor](../../testpilot-lab/observedEvidence.js)
- [Case and execution trail](../WEEK7_GEMINI_PLAYWRIGHT_EVIDENCE.md)
- [Human evaluation methodology](../AI_MANUAL_EVALUATION_PROTOCOL.md)
- [Latest verified main-branch Playwright run](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/41327612679)
