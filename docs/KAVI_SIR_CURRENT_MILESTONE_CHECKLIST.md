# Kavi sir — TestPilot current milestone checklist

_Last checked: 19 October 2026. The transcript shared in chat omitted the central project discussion (approximately 01:06–09:50), so this checklist preserves previously stated requirements without pretending to quote unseen feedback._

## What the project consists of

**Application 1 — existing healthcare system under test (SUT)**

- Deployed React booking frontend: https://doctor-appointment-frontend-9dbs.onrender.com/
- Deployed Express/MongoDB backend: https://doctor-appointment-booking-system-u1eq.onrender.com/
- Based on an existing GitHub doctor appointment booking system, not built as a new healthcare portal.
- Doctors, patients, administrators, authentication, availability and appointments provide the real requirements. Fictional training doctor profiles must not be presented as real clinicians.

**Application 2 — TestPilot Lab testing application**

- Independently deployed: https://testpilot-lab.onrender.com/
- Enter the **approved healthcare frontend URL**, select a **user story**, inspect public application evidence, and propose structured cases through an LLM when configured.
- The Lab includes **25 documented, source-grounded user stories** across **15 use cases**: [story report](WEEK5_USER_STORIES.md).
- The SUT's **36-case catalog** is a manually prepared design artifact, not proof of model generation or passing test cases: https://doctor-appointment-frontend-9dbs.onrender.com/test-cases

## Demonstration flow for the next instructor call

1. **Show SUT deployment**: open the healthcare home page and explain the original GitHub source, React/Express stack, Render deployment and MongoDB Atlas connection.
2. **Show real features**: approved doctor listing, 15 specialties, configured timetable, read-only availability preview, plus patient/doctor/admin flow definitions. Never submit real patient data.
3. **Show 25 stories**: browse [Week 5 user stories](WEEK5_USER_STORIES.md); trace an example (US-005 approved doctor list, US-007 available slots, or US-017 booking) to its actual API and source file.
4. **Show Lab**: open the standalone Lab, select US-005 and the allowed healthcare URL, then run **Inspect live application**. This reads public HTML and doctor catalog only.
5. **Show verified testing**: run the read-only US-005 check. The separate **Latest measured CI runs** panel reports independently measured automated tests, not model-generated tests.
6. **Explain AI generation accurately**: the endpoint and structured-output validation are implemented. Generating genuine model cases requires privately configured `OPENAI_API_KEY` and `LAB_ACCESS_CODE`. Demonstrate it only after verifying a real response. Initially label cases **NOT_RUN**. Reviewed cases may run audited, story-linked GET assertions; full patient booking tests require a disposable staging environment.
7. **Show documentation**: 25 stories, 15 use cases, 36 designed cases and Week 1–4 progress summary in [Week 5 report](WEEK5_PROGRESS_REPORT.md).

## Completion versus pending

| Deliverable | State | Evidence / limitation |
| --- | --- | --- |
| Use an existing GitHub healthcare application | **Done** | Adapted full-stack doctor appointment codebase |
| Deploy SUT frontend and backend | **Done** | Both Render URLs |
| Analyze real features | **Done** | 15 source-reviewed use cases |
| Document 20–25 user stories | **Done** | 25 stories in Week 5 report and Lab catalog |
| Build a **separate** testing application | **Done** | Standalone TestPilot Lab on Render |
| Accept URL + story, inspect safe public data | **Done** | Lab endpoints and public checks |
| Implement guarded LLM test-case generation | **Code prepared** | Needs private OpenAI API key + Lab access code for real demonstration |
| Execute confirmed production-safe checks | **Done, limited** | Fixed audited GET assertions, real PASS/FAIL/SKIPPED evidence |
| Execute model-generated full patient/admin workflow tests | **Not done** | Requires human review, synthetic fixtures and isolated staging/CI |
| Prove individual scenarios in the 36-case dashboard have run | **Not done** | Case library is NOT_RUN by design |

## Tests and deployment evidence

- [Latest Lab verification suite](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-lab-ci.yml)
- [Live Lab smoke workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-lab-live-smoke.yml)
- [Healthcare regression workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-ci.yml)
- The standalone Lab was refreshed on Render to commit `5cc1fc3b2ca405556161ebdf385ca1a1008ce284`, the source version containing the AI-case approval and safe execution panel. Check Render deploy status after newer commits.

## What is needed from the team

1. **Privately** configure a valid API key and Lab access code in the Lab's Render service to enable a live LLM demo. **Never paste API keys in a public document or source repository.**
2. Obtain the instructor's missing meeting feedback (the transcript supplied in chat skipped 01:06–09:50) to confirm any further requirements beyond the milestones listed here.
3. If full generated-case execution is required now, provision an **isolated** healthcare test backend/database and synthetic patients; do not run state-changing generated tests against production.
