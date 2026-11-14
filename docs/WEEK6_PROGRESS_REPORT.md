# TestPilot — Week 6 Progress Report

**Reporting period:** Progress consolidated through 13 November 2026  
**Project:** TestPilot — AI-Assisted Test Case Generation for a Full-Stack Healthcare Platform

## Executive summary

The project has progressed from documenting the healthcare system's user stories and building the separate TestPilot Lab to demonstrating AI-assisted test-case generation, a human-review interface, and selected Playwright browser checks executed through GitHub Actions.

The healthcare application remains the system under test. TestPilot remains a separate testing application.

## Work completed / evidence available

| Area | Progress through 13 November 2026 | Evidence / qualification |
|---|---|---|
| Existing healthcare application | Existing application deployed and used as the reference system under test | https://doctor-appointment-frontend-9dbs.onrender.com/ |
| Separate TestPilot Lab | Lab deployed independently and provides the test-case generation/review workflow | https://testpilot-lab.onrender.com/ |
| User-story-based generation | US-005 — Browse Approved Doctors used as a demonstration story; four candidate cases are visible in the shared Lab screenshot | Screenshot shows AI-001 to AI-004; retain the actual exported JSON as primary evidence |
| Human review | Review interface exposes reviewer decision, notes and execution mapping | The shared screenshot shows all four cases as Not reviewed and NOT RUN; do not report them as approved |
| Playwright CI — TC-0502 | Successful GitHub Actions run for US-005; one test passed | https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/43276851268 |
| Playwright CI — TC-0501 | A separate successful workflow run was recorded | https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/43277432846 |
| CI artifacts | TC-0502 workflow published an artifact | https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/43276851268/artifacts/13971476478 |

## TC-0502 execution details

- Story: **US-005 — Browse Approved Doctors**
- Check: **TC-0502 — directory filters by specialty and search text**
- Workflow run: **43276851268**
- Observed result: **1 passed**
- The check selects Cardiology and verifies the matching synthetic doctor fixture remains visible.
- It then searches for a value that does not match the synthetic fixture and verifies the no-matching-doctors state.

**Execution boundary:** This workflow uses a local frontend preview and synthetic API fixtures. It does not establish that the deployed production database was tested, and it does not prove that arbitrary Gemini-generated steps were executed.

## AI candidate review observations

The demonstrated US-005 generation view contains four candidate scenarios:

1. AI-001 — Retrieve approved doctors.
2. AI-002 — Exclude unapproved doctors.
3. AI-003 — Handle an empty doctor directory.
4. AI-004 — Handle concurrent public read requests.

The displayed expected results need more specific assertions for AI-002 and AI-003. AI-004 needs measurable concurrency acceptance criteria. The screenshot records all four candidates as **Not reviewed**, **NOT RUN**, and **Unsupported / needs engineering** for execution mapping. These are review recommendations and gaps, not completed approvals.

## Current limitations

- Only predefined, supported Playwright checks mapped to selected stories are executable.
- Generated candidate narratives are not automatically executable Playwright scripts.
- The demonstrated CI checks use synthetic fixtures and a local preview, not the production database.
- The four displayed AI candidates have not been recorded as reviewed or executed in the supplied screenshot.
- Independent human evaluation, reviewer sign-offs and a complete AI-versus-manual comparison must only be reported as complete when supporting records exist.
- Live Gemini generation depends on the configured service and must be demonstrated successfully before claiming a live generation during a presentation.

## Next actions

1. Review each generated candidate against its user story and improve expected results.
2. Record genuine reviewer decisions and notes; do not pre-mark cases as approved.
3. Implement and validate dedicated isolated checks for cases that currently have no supported execution mapping.
4. Preserve GitHub Actions logs and artifacts for each successful run.
5. Complete and document the independent human evaluation and AI-versus-manual comparison.
6. Keep the distinction clear between generated scenarios, reviewed cases, mapped checks and executed results.

## Presentation summary

The current demonstrable workflow is: existing healthcare application as the system under test → TestPilot user-story-based candidate generation → human review interface → selected predefined Playwright checks → GitHub Actions execution logs and artifacts.

This report records the evidence available through 13 November 2026 and does not claim full application coverage or execution of every AI-generated candidate.
