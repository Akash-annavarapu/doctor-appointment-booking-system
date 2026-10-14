# TestPilot — Kavi Sir's Next Presentation

## What the instructor asked for
This submission demonstrates an **existing GitHub healthcare application**, its real features, and a theoretical plan for automatically generating feature-based test cases with an LLM. The application was not developed from scratch for this assignment.

### 1. Existing healthcare application deployed
- Existing healthcare source: [doctor-appointment-booking-system](https://github.com/gantasrinivasarao96/doctor-appointment-booking-system) (upstream reference in project README).
- Adapted project repository: https://github.com/Akash-annavarapu/doctor-appointment-booking-system
- Healthcare application: https://doctor-appointment-frontend-9dbs.onrender.com/
- Backend API: https://doctor-appointment-booking-system-u1eq.onrender.com/
- Application under test: the same existing doctor appointment booking application, modified cosmetically and instrumented for testing.
- Explain the build/deployment route: GitHub → Render hosting (frontend/backend) → MongoDB Atlas; show the working homepage and demonstrate the doctor listing.

**Suggested presenter script:** "We selected an existing full-stack healthcare application from GitHub, reviewed its code, adapted its branding, and deployed the frontend and backend. This is the healthcare application we will test. We did not build a separate replacement healthcare portal."

### 2. Features and use cases identified
The backend routes and documented use cases support:

| Feature / user action | What it does | Example test concern |
| --- | --- | --- |
| Registration / login | Patient creates an account and signs in | Valid data, invalid credentials, expired token |
| Doctor listing | Patient browses approved doctors and specialties | Approved-only filtering, empty results |
| Availability | Patient checks future doctor slots | Blocked dates, outside working hours |
| Appointment booking | Patient reserves a valid free slot | Confirmed booking, duplicate reservation race |
| Appointment history | Patient views own bookings | Isolation between patient records |
| Doctor workflow | Doctor configures schedule and handles bookings | Correct state transitions, doctor permissions |
| Admin workflow | Admin reviews pending doctor applications | Patient must not approve an application |
| Notifications / uploads | Users receive updates and securely share files | MIME/size restrictions, access control |

The code-grounded design catalog already contains **15 use cases** and **36 documented testing scenarios**:
https://doctor-appointment-frontend-9dbs.onrender.com/test-cases

**Suggested presenter script:** "We inspected real routes and roles. Our use cases cover user authentication, appointment management, doctors, administrators, notifications and document handling. Each feature provides normal, invalid, boundary and security conditions for later test generation."

### 3. High-level approach to automatic test-case generation

1. **Extract verified feature descriptions:** frontend routes, backend APIs, inputs, authentication rules and documented user flows.
2. **Prepare a reviewed use-case record:** actor, preconditions, endpoint, input fields and expected output, using only synthetic fixtures.
3. **Ask an LLM for test scenarios:** normal flow, missing fields, invalid input, access control, scheduling limits and booking race conditions.
4. **Validate model output:** strict JSON structure, known endpoints, unique IDs and correct expected behavior. Reject unsupported assumptions.
5. **Human review before execution:** link approved cases to their source use case, then later convert to Jest/Vitest automation running against an isolated test database.
6. **Optional future reporting:** capture actual runner outcomes as PASS/FAIL; never label proposed or unexecuted cases as passed.

**Example:** For `POST /api/v1/appointment/book`, the generator can draft tests for successful booking (201), unavailable/out-of-hours slot (400), no authorization (401) and an already-booked slot (409), provided these responses match the reviewed application behavior.

**Suggested presenter script:** "Our method is to extract each real feature and its expected behavior, supply that structured description to an LLM, validate and review the proposed cases, and later automate execution. This week we are presenting the proposed mechanism, not claiming that all 36 scenarios were AI-generated or have passed."

## Evidence to share
- [Application homepage](https://doctor-appointment-frontend-9dbs.onrender.com/)
- [36-case design catalog](https://doctor-appointment-frontend-9dbs.onrender.com/test-cases)
- [Feature and use-case analysis](TESTPILOT_MILESTONE_2.md)
- [Test case matrix](TEST_CASE_MATRIX.md)
- [LLM proposal](LLM_TEST_CASE_DESIGN.md)
- [Existing automated CI workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-ci.yml)

**Do not overclaim:** The 36-case catalog is documented test design; a separately verified CI run proves automated regression checks, not the LLM's ability to create executable code live. Live provider calls require secure backend API configuration, which is beyond the instructor's requested next-presentation scope.
