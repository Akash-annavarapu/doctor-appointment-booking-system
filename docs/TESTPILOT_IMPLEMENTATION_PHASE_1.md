# TestPilot — Dashboard and Automated Regression Tests (Implementation Phase 1)

**Scope:** A read-only, publicly viewable catalog of the 36 *designed* test cases is now implemented in the React app. Selected high-priority cases are covered by executable **Vitest** UI tests and **Jest + Supertest** backend integration tests. The original healthcare workflows are unchanged.

## Open the UI

- Website: https://doctor-appointment-frontend-9dbs.onrender.com/
- Test case dashboard: https://doctor-appointment-frontend-9dbs.onrender.com/test-cases
- Navigation: **Test Cases** is accessible even when signed out, because it contains only non-sensitive, synthetic design documentation.
- Filter the 36 cases by search, category, use case and priority; open a card for designed test steps, expected outcome and code references.

**Status transparency:** Every row displays **Not run**. Those labels are not synced to Jest, Vitest or GitHub Actions. A green CI workflow is evidence of its tests executing in CI, *not* evidence that each of the 36 catalog scenarios was tested. No AI generator has been integrated at this stage. Do not use the catalog to assert 36 passing tests.

## Executable tests

### Frontend (Vitest + React Testing Library)

- `client/src/pages/__tests__/TestCases.test.jsx` — 5 tests: IDs and initial status, search/detail rendering, category/use-case/priority filtering, empty state/reset, basic trace integrity.
- Existing UI suites continue to cover login, registration, booking view, navigation, notifications, dashboard guards, etc.

Run:
```bash
cd client
npm ci
npm test
npm run build
```

### Backend (Jest + Supertest + MongoDB test database)

- `server/tests/testpilotPriority.test.js`: TP-002, TP-003, TP-004, TP-006, TP-009, TP-010/017, TP-011, TP-012.
- Original integration suites (e.g. `auth.test.js`, `authorization.test.js`, `appointmentFlow.test.js`, `doctorLifecycle.test.js`, `notificationFlow.test.js`) already include important behaviors such as successful login, role access, doctor approval, booking status transitions, concurrent booking races, restricted medical-document access and notification ownership.

Only run against **an isolated, disposable MongoDB database** whose name ends in `_test`. The test setup explicitly rejects a missing URI, a name lacking `_test`, or using the same URI as the normal database. **Tests delete synthetic fixtures. Never supply production credentials/connection strings.**

```bash
cd server
npm ci
# supply JWT_SECRET and a local/disposable MONGO_URI_TEST whose DB name ends with _test
npm test
```

### Continuous integration

`.github/workflows/testpilot-ci.yml` runs on pushes to `main` and pull requests. It runs:

1. Frontend `npm ci`, `npm test`, `npm run build`.
2. Backend `npm ci`, `npm test` with an ephemeral MongoDB container using `testpilot_ci_test` and a synthetic JWT secret.

CI does **not** send requests to the production backend or operate on live patient records.

## Current milestones

| Milestone | State |
|---|---|
| Deploy existing healthcare app | Complete |
| Document features + use cases + LLM test generation strategy | Complete |
| Display 36 designed cases in TestPilot | Implemented |
| Add selected executable cases with traceable IDs | Implemented in source; check CI for execution results |
| Implement actual LLM-based test generation | **Not implemented** |
| Execute all 36 scenarios end-to-end and sync results to dashboard | **Not implemented** |

## Next phases (not included here)

- Link actual CI run artifacts and per-test results to IDs (rather than inventing UI statuses).
- Add a secure admin/reviewer-only interface for approving generated candidate cases.
- Implement actual LLM generation with structured output validation and privacy safeguards.
- Create an end-to-end test fixture for a real approved doctor and booking workflow in a test environment, not on live patient data.

### Academic demo

Show the live dashboard and the GitHub test suites. Explain: **use cases → designed test cases → implemented automated checks → execution logs**. The LLM generation workflow remains a proposed later phase.


## Doctor specialization demo (next incremental feature)

Fifteen fictional demo clinicians cover these distinct specializations: General Medicine, Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, ENT, Gynecology, Ophthalmology, Psychiatry, Gastroenterology, Pulmonology, Endocrinology, Urology, Dentistry. Their `isDemo` flag and disclaimers distinguish them from real clinicians.

The homepage's doctor section displays configured weekly sessions and includes a specialization/search filter. A **public read-only** endpoint `GET /api/v1/doctor/available-slots?doctorId=...&appointmentDate=...` calculates remaining slots while withholding patient and booked-appointment details. Booking itself still requires authentication via `POST /api/v1/appointment/book`. Do not use real patient information in this environment.

Repository fixture: `server/scripts/demoDoctorData.js`. Idempotent one-time seed script: `server/scripts/seedDemoDoctors.js`. The two original pending doctor applications are not modified by this feature. CI includes doctor-directory presentation tests and public availability tests. Passing tests are **not** a substitute for manually verifying a test-patient appointment end to end.
