# TestPilot — Problem Statement Compliance and Near-Final Readiness

**Reviewed:** 24 October 2026  
**Scope:** AI-assisted software testing of an existing doctor appointment booking application

## Problem statement

Manual preparation of test cases for user registration, doctor discovery, availability and appointment booking takes time and may omit negative, boundary and role-based cases. TestPilot is a separate testing tool for an existing GitHub healthcare application. It takes an approved deployed application URL and a role-based user story, produces structured LLM test-case suggestions, supports reviewer-controlled verification and reports real test outcomes. Testing must not alter the live healthcare database with arbitrary AI-generated scripts.

## Requirement-to-evidence audit

| Problem-statement requirement | State | Evidence / exact boundary |
| --- | --- | --- |
| Reuse, deploy and keep existing healthcare application | Implemented | [Healthcare frontend](https://doctor-appointment-frontend-9dbs.onrender.com/), [backend](https://doctor-appointment-booking-system-u1eq.onrender.com/), Render services, existing React/Express/MongoDB code |
| Study healthcare user flows | Implemented | 25 role-based documented stories across 15 use cases; `testpilot-lab/user-stories.json` |
| Prepare documented/manual test cases | Implemented | 36 `TP-001…TP-036` case designs; `client/src/data/testCases.js` |
| Build separate application to accept URL and story | Implemented | [TestPilot Lab](https://testpilot-lab.onrender.com/) with allowlisted URL, editable role-based story and code-grounded acceptance criteria |
| Generate real structured candidate cases using an LLM | Implemented; free-tier quota dependent | Google Gemini provider, 4–8 cases, schema validation, synthetic data guidance, signed receipt; actual Gemini results observed in team demo. All candidates begin `NOT_RUN` |
| Human review, signed case selection and restricted execution | Implemented for supported checks | Approval checkboxes, server-issued short-lived HMAC receipt, strict read-only GET probe allowlist, accurate PASS/FAIL/SKIPPED reporting for executed probes only |
| Execute browser tests safely | Implemented for reviewed fixed checks | [Playwright Chromium regression suite](../e2e/tests/healthcare.browser.spec.cjs), synthetic fixtures, all writes rejected, plus [manually triggered reviewed-story workflow](../.github/workflows/reviewed-playwright.yml) |
| Connect reviewed story to supported browser checks | Implemented with manual triggering | Only explicitly source-approved `US-###` → `TC-####` combinations can be chosen. The GitHub workflow runs a **prewritten** Chromium scenario, not arbitrary Gemini steps |
| Show actual measured execution results and artifacts | Implemented | GitHub Actions JSON/HTML reports, screenshots and failure traces, protected CI report ingestion, Lab per-test read-only CI evidence and healthcare result dashboard |
| Compare AI-generated cases against manual designs | Implemented, structured comparison and reviewer scoring | Lab's **Compare with manual test cases** uses signed model output and the 36-case baseline; compares types/priorities, then lets humans score each acceptance criterion as Covered / Not covered / Not reviewed for AI and manual cases; exports the evidence as JSON |
| Trace all documented stories to available tests | Implemented | **Story → Test coverage mapping** panel shows all 25 stories, all 15 use cases, matching manual IDs and eligible fixed tests without inventing passing results |
| Run arbitrary AI-created end-to-end booking/admin test scripts automatically | **Not implemented intentionally** | Requires a distinct, reviewed execution specification, disposable MongoDB fixtures, state-reset rules, and stronger isolated automation. Never run unrestricted generated code on Render's public production app |
| Complete empirical AI-versus-manual quality study | **Scoring feature implemented; sample study still pending** | A reviewer can explicitly score both case sets against each acceptance criterion and export the decisions. The team must perform and document a representative study before drawing a quality conclusion |
| Final academic report, recorded walk-through and viva | **In progress** | Architecture/workflow presentation exists; final evidence and reviewer conclusions still need to be assembled |

## Latest reproducible workflow

1. Open the existing healthcare system; explain the React/Vite frontend, Express REST API and MongoDB Atlas database.
2. Open TestPilot Lab and select US-005 (approved doctor list). Inspect the allowlisted healthcare website.
3. Use the privately configured Gemini provider to generate structured `AI-###` candidates. Cases are **NOT RUN**.
4. Review the cases, approve selected items and run source-verified, read-only checks. Report actual results with their limited scope.
5. Select **Compare with manual test cases** to compare actual Gemini metadata with the authored `TP-###` baseline. Review each story acceptance criterion, independently mark AI/manual case coverage as Covered, Not covered or Not reviewed, add notes, and export the reviewer-assessed comparison JSON.
6. Select **Show safe browser checks for approved cases**. For supported stories only, manually open GitHub Actions → **Reviewed story Playwright check**, enter the displayed `story_id` and `browser_check_id`, and click **Run workflow**. This runs one fixed, source-reviewed scenario with synthetic fixture traffic, not the candidate's arbitrary narrative.
7. Click **Load verified CI reports** to see actual GitHub Actions suites and their measured per-case statuses. Expand an individual CI run for evidence.
8. Click **Load story coverage matrix** to explain how the documented stories relate to available manual, read-only and browser checks.

## Security and test-evidence rules

- `GEMINI_API_KEY` and `LAB_ACCESS_CODE` remain private Render environment variables. Do not paste them into public documents or commit them to GitHub.
- A generated case must have its original signed receipt to be evaluated or approved for supported execution. Editing signed case data, or using an expired receipt, invalidates that proof.
- The reviewed Playwright workflow accepts only source-reviewed user story and browser test ID pairs. It never accepts scripts or URLs to run.
- The healthcare production backend and patient database are never targets for state-changing Playwright fixture runs.
- Manual case designs, Gemini suggestions, safe live API checks, and prewritten Playwright CI tests are distinct kinds of evidence and must be reported separately.
- Matching a generated case to a browser scenario does **not** prove the AI-generated scenario was executed. The manually triggered browser run only proves the prewritten selected assertion.

## Completion estimate and what remains

The original previous-project estimate was about **80%** before the coverage and reviewed-run improvements. The new features close substantial design-to-evidence gaps, but there is **no objective 95% completion score** unless the instructor accepts a scope rubric. For an academic prototype, functionality is now near-final, with remaining items concentrated in:

1. Human-assessed correctness and acceptance-criteria coverage of Gemini vs manual test cases.
2. Direct, **fully isolated** execution of human-approved generated workflows beyond the prewritten browser check mapping, including state-changing synthetic bookings.
3. Final written evaluation, screenshots, discussion of limitations and rehearsed final demonstration.

**Do not claim that the project has executed every Gemini-generated test or achieved a verified 95% completion metric.**

### References

- [Source repository](https://github.com/Akash-annavarapu/doctor-appointment-booking-system)
- [Healthcare application](https://doctor-appointment-frontend-9dbs.onrender.com/)
- [TestPilot Lab](https://testpilot-lab.onrender.com/)
- [GitHub Actions test history](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-ci.yml)
- [Reviewed fixed browser workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/reviewed-playwright.yml)
