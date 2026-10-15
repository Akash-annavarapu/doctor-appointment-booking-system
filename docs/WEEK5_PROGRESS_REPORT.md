# TestPilot — Week 5 Milestone Progress Report

**Project:** AI-Assisted Test-Case Generation for an Existing Healthcare Application  
**Instructor:** Kavi Arasu V.  
**Submission focus:** Use stories (20–25), weeks 1–4 progress, Week 5 plan and parallel development of the separate testing application.

## Executive summary

At the instructor's direction, the project consists of two distinct applications. The **system under test** is an existing open-source doctor appointment booking application, deployed on Render and backed by MongoDB Atlas. The **TestPilot Lab** is an independent testing application being built to accept the SUT URL and a user story, inspect public application evidence, and generate test cases using an LLM. Automated test execution and real results are the next-phase milestone—not part of the 25-story documentation requirement.

## Demonstrable links

- Deployed SUT frontend: https://doctor-appointment-frontend-9dbs.onrender.com/
- Deployed SUT backend: https://doctor-appointment-booking-system-u1eq.onrender.com/
- Adapted SUT source: https://github.com/Akash-annavarapu/doctor-appointment-booking-system
- Original GitHub application: https://github.com/gantasrinivasarao96/doctor-appointment-booking-system
- Existing test-case design catalog: https://doctor-appointment-frontend-9dbs.onrender.com/test-cases
- Separate Lab source folder: https://github.com/Akash-annavarapu/doctor-appointment-booking-system/tree/main/testpilot-lab

## Milestone 1 — Existing application deployment

The selected system was not built from scratch. The existing healthcare code uses React, Node/Express, JWT and MongoDB. It was customized for academic demonstration and deployed as public frontend/backend services on Render. The deployed doctor's public catalog and availability can be demonstrated safely with fictional data. Core registration, booking and role-protected routes remain part of the existing system.

## Milestone 2 — Understanding and documenting user stories

The application's 15 primary use cases have been traced to source files. This report is accompanied by **25 structured user stories** covering visitors, patients, doctors and administrators. Each record has a user role, action, business value, route, mapped use case, acceptance criteria and implementation source. See [25 User Stories](WEEK5_USER_STORIES.md).

## Weeks 1 to 4 — Retrospective workstream summary

The following week-by-week organization is a **presentation outline for work accomplished previously**, not a verified timesheet of exactly when each task occurred.

| Week | Workstream | Deliverable/evidence |
|---|---|---|
| 1 | GitHub healthcare application selection and code exploration | Existing doctor booking system selected; stack and modules identified |
| 2 | Hosting and deployment | Render frontend/backend linked to MongoDB Atlas, public healthcare URL |
| 3 | Workflow/actor analysis | Patient, doctor, admin workflows; 15 use-case catalog and source traceability |
| 4 | Testing design/instrumentation | 36 test scenarios, Jest/Vitest automated checks, CI and measured result reporting |

## Week 5 — 50% milestone submission

| Deliverable | Current status | Evidence |
|---|---|---|
| 20–25 role-based stories | Prepared: 25 stories, 15 use cases | docs/WEEK5_USER_STORIES.md; testpilot-lab/user-stories.json |
| Week 1–4 and Week 5 progress report | Prepared | This document |
| Show deployment URL and functionality | Existing deployment available; verify live demonstration | Healthcare homepage; public doctor listing |
| Separate testing app prototype | Implemented in independent testpilot-lab folder; deployment still required | Lab server.js and UI |
| Enter a user story and SUT URL | Implemented in Lab UI | GET /api/stories; URL and story inputs |
| Safe live SUT inspection | Implemented against allowlisted public paths | POST /api/inspect; no authenticated operations |
| Actual LLM test-case generation | Code prepared, **not operational until OpenAI API key and lab access code are configured** | POST /api/generate |
| Execute generated tests and report PASS/FAIL | **Planned for third milestone** | No executed AI-generated test results are claimed |

## Lab architecture and workflow

1. User enters verified healthcare deployment URL and chooses one of 25 source-reviewed user stories.
2. The independent TestPilot Lab backend reads public HTML and approved doctor catalog from preapproved origins, preventing arbitrary network crawling.
3. Server combines safe public observations with the selected story's role, source route, use-case ID, and acceptance criteria.
4. With a configured private OpenAI API key, the server requests 4–8 structured test-case candidates.
5. The Lab validates JSON shape, case IDs and allowed categories, then displays/export cases as reviewed=false and NOT_RUN.
6. Later, human-approved test cases will be converted to executable suites against synthetic fixture data and an isolated test database. Results will be measured and reported.

## Distinction between the two applications

| Healthcare application | Testing application |
|---|---|
| Existing code from GitHub, deployed on Render | New standalone TestPilot Lab, a separate Node service |
| Real user-facing healthcare workflows and database | Story intake, public inspection, AI generation, future CI orchestration |
| Appointment booking, profiles, doctors, admin, notifications | Candidate tests and later execution reports |
| Must never be modified or stress-tested by unreviewed generated scripts | Must not claim PASS until approved tests actually run |

## Known gaps, prerequisites and limitations

- Deploy TestPilot Lab as a second Render web service, not as a replacement of the original healthcare app.
- An OpenAI API key and a separate Lab access code must be securely supplied to that new service for live generation; no secrets belong in Git or user-browser code.
- Inspecting public HTML and doctor endpoints is **not** equivalent to an autonomous browser understanding every login-protected feature. Feature knowledge is primarily grounded in audited code/use cases.
- The documented 25 user stories are not proof that the user journey has been tested end-to-end; additional fixtures and access permissions may be required.
- Never use real patient records. Isolated CI automation and test-result screenshots belong to the next milestone.

## Suggested 10-minute speaking sequence

**Minute 0–2:** Explain Kavi sir's clarified three-phase project and show deployed healthcare URL.  
**Minute 2–4:** Demonstrate existing patient/doctor/admin features and 15 use-case understanding.  
**Minute 4–7:** Explain 25 user stories using US-001 registration, US-017 booking and US-021 doctor decision as concrete examples.  
**Minute 7–9:** Show Lab's separate UI architecture: input URL and story → public inspection → LLM candidates. State API/deployment prerequisites accurately.  
**Minute 9–10:** Recap Weeks 1–4, Week 5 progress and next step: execute approved AI-generated cases in isolated test CI and report actual outcomes.

## Acceptance checklist for meeting

- [ ] Share the public healthcare URL and display doctor listing.
- [ ] Show the 25 user stories with role and acceptance criteria.
- [ ] Explain one complete booking story from patient perspective.
- [ ] Show the separate Lab code/UI and explain how URL + story generate cases.
- [ ] Distinguish already-documented cases from LLM-generated cases.
- [ ] Explain Week 1–4 progress and Week 5 scope.
- [ ] Identify next milestone as automated execution and measured reporting.

