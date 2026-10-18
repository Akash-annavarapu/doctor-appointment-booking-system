# Week 5 — Playwright execution and results dashboard

**Instructor timeline:** Weeks 5–6 = Playwright execution + Results dashboard.
**Status:** First Playwright milestone implemented and verified on 19 October 2026.

## Delivered and measured

The healthcare system is an existing React/Vite frontend backed by Express/MongoDB Atlas. This Week 5 suite runs actual Chromium browser interactions against a locally built copy of that frontend on GitHub Actions. All API calls inside the browser are intercepted with synthetic fixtures; state-changing requests are blocked.

| Browser scenario | Test ID | Result from GitHub Actions |
| --- | --- | --- |
| Homepage and fictional doctor cards render | TC-0501 | PASS |
| Specialty dropdown and doctor search filter correctly | TC-0502 | PASS |
| Guest booking redirects to login without submitting a booking | TC-0503 | PASS |
| Read-only date-specific slot preview displays fixture slots | TC-0504 | PASS |
| The manually designed 36-case library can be searched | TC-0505 | PASS |
| Anonymous visit to the doctor-only route redirects to login | TC-0506 | PASS |
| Empty login form stays on login and uses browser validation | TC-0507 | PASS |

**Measured run:** [GitHub Actions regression run 39174715694](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/39174715694), **7 PASS / 0 FAIL / 0 SKIPPED** (Chromium browser, synthetic fixtures). Download the [Playwright HTML report and screenshots artifact](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/39174715694/artifacts/12153976028).

These cases are **TC-0501–TC-0507**, a separate browser smoke suite. They do NOT imply that the 36 manually designed TP cases or every scenario proposed by Gemini has been executed. The Playwright test runner is not currently executing arbitrary AI-generated code.

## Results dashboard integration

- A third GitHub Actions job, **Playwright Chromium browser tests (synthetic data)**, is part of the existing `TestPilot regression checks` workflow.
- Playwright writes machine-readable JSON and HTML results, screenshots and traces. CI uploads the artifacts even when tests fail.
- A separately unit-tested adapter (`e2e/scripts/toJest.cjs`) converts only measured Playwright results into the reporting format accepted by `server/scripts/publishTestReport.js`.
- The publisher uses the existing main-branch GitHub Actions OIDC trust (not a personal API token). The verified Playwright run reported **"Published 7 measured test results."**
- The deployed healthcare site's [Test Cases dashboard](https://doctor-appointment-frontend-9dbs.onrender.com/test-cases) and [TestPilot Lab CI panel](https://testpilot-lab.onrender.com/) obtain results from the existing backend reports API. **Click Load verified CI reports** in the Lab and look for the `playwright-chromium` suite; only accepted, actual reports appear. The CI publisher may need the backend to be available.
- User stories and free-tier Google Gemini generation are still available in TestPilot Lab. Their output requires review; an unrelated browser test cannot automatically mark an AI-generated narrative case PASS.

## Safe execution design

- Browser tests use `VITE_API_BASE_URL=http://127.0.0.1:4173/api/v1` and intercept the `/api/v1/**` network calls.
- All non-GET API calls are rejected in the fixture; the suite never logs in using patient credentials, submits registration, creates bookings or changes production MongoDB data.
- Synthetic doctor names, costs and time slots are test fixtures, not real clinician claims or live availability.
- The separate live **Verified live checks** (safe read-only GET requests) remain independent of this local fixture-driven Playwright suite.
- The browser suite asserts **rendering, search, protected routing and previews**; it cannot alone prove the production backend's booking rules are correct.

## Remaining Week 6 work

1. Define an auditable binding from *human-approved* Gemini-generated test cases to specific fixed Playwright browser scenarios; execute each bound scenario only in isolated CI.
2. Build dedicated synthetic patient, doctor and admin fixtures in a disposable database to test login/booking/mutation workflows safely.
3. Extend the dashboard with per-scenario evidence links and a clear distinction between actual Playwright assertion results, live read-only API checks, manually designed cases and unexecuted LLM candidates.
4. Add a failure screenshot/trace walkthrough for Kavi sir's demo and review browser execution coverage against manual test cases for Week 7.

## What to show Kavi sir

1. Open the existing healthcare website and the separate TestPilot Lab, select US-005, and show a genuine Gemini-generated case (NOT_RUN until approved/executed).
2. Open the Playwright GitHub Actions run and its Chromium suite showing **7 PASS**; explain these use synthetic browser fixture data.
3. Open TestPilot Lab → **Latest measured CI runs** → **Load verified CI reports**, where `playwright-chromium` appears if ingestion succeeds.
4. Explain that full model-generated workflow execution and patient booking automation are *next*, and never claim they already passed.

Source: [e2e/](../e2e/), [.github/workflows/testpilot-ci.yml](../.github/workflows/testpilot-ci.yml).
