# BITS Pilani BSDCH ZC229T — TestPilot proposal-to-deliverable acceptance record

**Prepared:** 31 October 2026 · **Project:** TestPilot — AI-Assisted Test Case Generation for a Full-Stack Healthcare Platform

This document uses the supplied BSc Design and Computing proposal as the acceptance contract. **It does not certify a final submission or replace faculty/team validation.** Implementation, test evidence, reviewer decisions and model outputs are explicitly distinguished.

## Original-app rule and actual architecture

- The healthcare application was **sourced from an existing GitHub appointment-booking project**. TestPilot is a **separate** application at https://testpilot-lab.onrender.com/; healthcare frontend is https://doctor-appointment-frontend-9dbs.onrender.com/. Do not claim that the original healthcare app was written from scratch for this project.
- The actual cloned/reworked app uses **React/Vite, Bootstrap, Express, Node.js and MongoDB**. The current `client/package.json` does **not** include Redux Toolkit or Tailwind CSS, despite the proposal's reference-stack description. This is a project-selection/stack deviation requiring faculty acknowledgement; do not misstate its dependencies or rebuild the healthcare app merely to change technologies.
- The current TestPilot Lab UI uses HTML/CSS/JavaScript and a dependency-light Node.js HTTP server, rather than the proposal's **recommended** React/Next.js + Tailwind and FastAPI/Express. The LLM defaults to a free-tier **Google Gemini** integration instead of the listed OpenAI/Claude options; the model is a real LLM, not a fixed template. The team should document and seek approval for these recommended-technology substitutions.
- A local disposable MongoDB database is used for mutating Playwright tests; real patients and production appointments are never test fixtures. Synthetic Playwright API runs exercise the reused healthcare application's real Express endpoints.

## Proposal requirement-by-requirement status

| Contract requirement | Evidence in repository or service | Current status and boundary |
| --- | --- | --- |
| Deploy existing full-stack healthcare application, not build from scratch | Existing forked healthcare React frontend and Express/MongoDB backend; Render deployments | **Implemented**; document source and technology deviations |
| Document 15+ user stories across patient, doctor, admin | `testpilot-lab/user-stories.json` | **Implemented**: 25 stories across 15 use cases |
| User-story input form and prompt layer | Lab `#story-input`, `#prompt-variant`, backend `generateCases` | **Implemented**: four allowlisted real prompt variants |
| LLM generates structured positive/negative/edge suggestions | Gemini/OpenAI structured-output integration; 4–8 cases, typed metadata | **Implemented**; edge coverage is requested, not guaranteed on every model response |
| Reviewers can edit, approve, reject and flag missing scenarios | Lab editable cards, `/api/review`, `reviewSession.js`, export | **Implemented** in prototype; review identity is self-declared, not independent authentication |
| Approved cases execute on deployed healthcare app | `/api/execute-reviewed` and related fixed Playwright suites | **Partial**: direct Lab execution covers matching, audited read-only probes. Reviewed AI-001–AI-004 booking **intents** have passed fixed Playwright API tests against a locally deployed isolated backend. The Lab does not dynamically execute arbitrary edited LLM steps |
| Test report dashboard with pass/fail and failure evidence | Lab measured run panels; GitHub Playwright HTML report, screenshots on failed browser tests and traces | **Partial**: actual results appear; failures' detailed artifacts live in the separate test runner rather than directly inside the Lab dashboard. API-only failures may not have screenshots |
| 36 human-written comparison cases | `client/src/data/testCases.js`, `testpilot-lab/manual-baseline.json` | **Implemented**; baseline must remain unchanged during study |
| Academic comparison between AI vs manual coverage | `/api/evaluate`, `evaluation.js`, reviewer criteria scoring | **Tooling implemented; human-completed comparative study still required** |
| Minimum ten actual prompt experiments across three user stories with full LLM output, 1–5 ratings, and changed-prompt rationale | Lab prompt experiment panel and JSON export | **Collector implemented; ten actual, reviewer-scored experiments not verified as completed** |
| Peer usability validation | Reviewed user stories, interface and browser UI assertions | **Peer session evidence pending**; scripted browser checks are not human usability participants |
| Week 8 narrative report, reflection and faculty presentation | This rubric; existing `docs/` reports and run artifacts | **Draft evidence available**; actual study conclusions and team sign-off pending |

The proposal lists **CI/CD pipeline integration as out of scope**. Existing GitHub Actions workflows are used as **internal engineering verification and artifact collection**, not presented as a required TestPilot product feature.

## End-to-end demonstration

1. Open the already-deployed healthcare application and demonstrate the patient, doctor, admin flows. Do not enter real patient records.
2. Open the separate Lab and select `US-001`, `US-005`, or `US-017`; inspect the allowlisted public URL.
3. Choose a prompt variant: **baseline**, **boundary**, **authorization**, or **assertions**. Record *what changed and why* in the prompt-change field. Generate 4–8 genuine LLM suggestions using the privately configured provider.
4. In each generated case, **edit description/preconditions/steps/synthetic test data/expected outcome**, select **Approve**, **Reject**, or **Not reviewed**, and document missed scenarios. Click **Save signed human-review decisions**.
5. Export the original-vs-reviewed case set. Run the *supported* approved fixed GET checks; unsupported scenarios must display **SKIPPED**, never synthetic PASS.
6. Open the Playwright report and point to `AI-001`–`AI-004` under `e2e/tests/generated-booking.api.spec.cjs`. These represent **human-adapted genuine Gemini US-017 case intents** run against isolated local Express+Mongo. Link the specific run and disclose the fixture adaptations.
7. Compare the real AI cases with the frozen manual baseline by test type and human-scored acceptance criteria. Avoid inferring semantic coverage from matching counts.
8. Give each actual LLM response independent 1–5 ratings for **completeness, accuracy, healthcare relevance** plus a concrete reviewer observation; export the experiment log JSON after collecting the ten actual runs.
9. Open the HTML report/traces if a browser test failed. Never imply a failure screenshot exists for a passing test or for an API-only assertion.

## Ten-run prompt engineering plan — a protocol, not fabricated results

The Lab automatically captures genuine provider responses, exact synthetic story input, prompt version, chosen variant, UTC timestamp, provider/model, and generation duration. The reviewer must score the results; **blank scores are `null`, not zero or five**. The following is the experiment **schedule only**:

| Planned iteration | Documented user story | Prompt variant | Comparison objective |
| --- | --- | --- | --- |
| 1 | US-001 registration | baseline | initial completeness |
| 2 | US-001 registration | boundary | seven/eight-character password thresholds |
| 3 | US-001 registration | assertions | verifiable HTTP and persistence oracles |
| 4 | US-005 browse approved doctors | baseline | approved-only directory |
| 5 | US-005 browse approved doctors | boundary | empty catalog and missing records |
| 6 | US-005 browse approved doctors | assertions | expected response schema |
| 7 | US-017 appointment booking | baseline | valid pending booking |
| 8 | US-017 appointment booking | boundary | missing fields, unavailable slots |
| 9 | US-017 appointment booking | authorization | no token / forbidden actions |
| 10 | US-017 appointment booking | assertions | status, state and conflict verification |

To become evidence, each row must be run against a **real configured model**, exported, independently assessed and supplied with a reviewer observation explaining the change. Do **not** backfill invented responses, scores or timings. Different prompt variants are implemented as version-controlled server prompt instructions rather than user-provided executable code.

## Human review / peer usability protocol

Run at least two peer sessions with synthetic stories. Have each participant independently complete input → generate → edit → approve/reject → export → inspect report. Record **actual** participant initials (with their consent), device/browser, start/end time, task completion, any blocking interaction, comprehension of `NOT_RUN` vs `PASS`, specific UI feedback and recommended change. Do not call automated UI test results peer sessions.

For academic quality comparison, have two team members separately grade each acceptance criterion as `covered`, `not_covered` or `not_reviewed` for both AI and manual sets. Explain the specific case IDs and steps. Resolve disagreements explicitly and compute coverage as `covered / (covered + not_covered)`, disclosing the number unreviewed. Keep separate completeness/accuracy/healthcare ratings; report generation and human review time independently.

## Safeguards and limitations

- No real patients or production database writes for automation. Never execute generated JavaScript. Reviewed **narrative edits** are not trusted executable scripts.
- The new review receipt cryptographically binds *exact* edited decisions to an original short-lived LLM generation receipt and a story/URL; both expire and server restart invalidates outstanding receipts.
- The review UI uses a shared Lab access code and **does not prove which person approved a case**. For authenticated audit trails and multi-user persistence, a separate identity-backed store would be needed.
- Prompt history is kept in **browser session storage** and can be exported; it is not a shared persistent evaluation database. Export before closing the tab.
- There is no automatic AI correctness judgment and no verified team/faculty sign-off on the 10-iteration experiment. The proposal is only fully satisfied when those **real evidence-dependent** outcomes are completed.
- Screenshots/traces are captured by Playwright for browser failures; API-only failures produce measurable HTTP/error assertions, not visual screenshots. Publish no sensitive diagnostic logs.

## Existing verified execution evidence

[31 October Playwright main-branch run — 26 passed, 0 failed](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/41181891382). The earlier passing `AI-001`–`AI-004` cases are mapped to one archived real Gemini `US-017` export, whereas the concurrency `US-018` test and five `US-001/US-005` checks are **source-derived**, not model-created. `docs/WEEK7_GEMINI_PLAYWRIGHT_EVIDENCE.md` contains the detailed mapping.

**Final submission rule:** call the source-grounded modules implemented, only call an experiment reviewed after a real reviewer evaluates it, and call individual tests passed only with a measurable run URL and case ID.
