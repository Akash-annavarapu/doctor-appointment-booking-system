# TestPilot - Final Mentor Review Report | 6 November 2026

**Institution:** Birla Institute of Technology & Science, Pilani - WILP  
**Programme / course:** BSc Design and Computing / BSDCH ZC229T (Design Project)  
**Project:** TestPilot - AI-Assisted Test Case Generation for a Full-Stack Healthcare Platform  
**Mentor:** Kavi Arasu V  
**Meeting:** 6 November 2026  
**Document status:** Final **mentor-call** technical report; academic/faculty acceptance and human-evidence authentication are separate.  
**Sources:** Frozen project repository, authentic user-exported Gemini log (SHA-256 below), reviewer and peer JSON exports, GitHub Actions results, team completion statement in chat.

## Executive summary

TestPilot is a working AI-assisted testing platform linked to an existing healthcare doctor-appointment application. It uses source-grounded user stories to request test case suggestions from Google Gemini, permits editing and human review, compares suggestions to a 36-case manual baseline, and provides measured execution of *fixed, source-reviewed Playwright tests* in an isolated synthetic environment. The scope documents **25 user stories across 15 use cases** and healthcare patient, doctor and administrator workflows.

The controlled **ten-run Gemini study** produced **40 suggested case specifications** across US-001 (patient registration), US-005 (approved doctor browsing), and US-017 (appointment booking). A technical comparison against 13 relevant manual cases identified **4 fully covered, 4 partially covered, and 5 missing** scenarios. These are case-design classifications, **not measured AI execution pass rates** and **not independently ratified two-reviewer scores**.

The verified main-branch CI run [#42131317272](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/42131317272) completed successfully: **29 Playwright PASS, 1 SKIP, 0 FAIL**. Frontend and backend jobs also succeeded. Ten specifically mapped *fixed* case-level checks were logged as passing; the case-level JSON evidence artifact was uploaded. The 40 new Gemini narratives remain `NOT_RUN`, and are not claimed to be executed as arbitrary code.

The team **reports Tasks 1-6 completed as activities** for this call. For Tasks 1-3, the currently accessible exports and declarations are not sufficient to independently authenticate final reviewer sign-offs, verify two distinct reviews for each immutable case set, or resolve all observed usability discrepancies. These are **documentary verification limitations**, not an assertion that the team did not perform the activities.

## 1. Problem, objectives and research method

Manual testing of healthcare workflows is demanding because registration rules, approved-doctor filters, appointment slot conflicts, authorization, data validation and boundary behavior must be checked precisely. LLM-generated cases can suggest relevant scenarios rapidly but may contain invalid request fields, weak expected results or missed boundaries. The project therefore emphasizes AI-assisted *design* with human oversight and controlled execution instead of automatic execution of generated scripts.

The project objectives were to deploy the existing healthcare application; build TestPilot as a separate prototype; map patient, doctor and admin requirements to structured user stories; generate positive, negative, security and edge cases; compare with a stable manual baseline; facilitate human review; safely execute supported reviewed scenarios with Playwright; and preserve reliable results for faculty assessment.

**End-to-end workflow:** documented requirement -> source-grounded Gemini prompt -> model response -> human editing/review -> AI/manual comparison -> fixed approved test recipe -> isolated browser/API run -> GitHub Actions evidence.

## 2. Implementation and environment

| Component | Implementation | Evidence boundary |
| --- | --- | --- |
| Healthcare AUT | Existing frontend, Node/Express API and MongoDB persistence | No uncontrolled tests against production patient data |
| TestPilot Lab | Separate browser/Node application, user story input and review workspace | Saved review identifiers do not authenticate people |
| Gemini generation | Controlled baseline/boundary/assertions/authorization prompt variants | Original outputs retained as candidate designs |
| Manual reference | 36 design cases, with 13 relevant to selected study workflows | Baseline specifications are not automatically passing tests |
| Playwright | Source-reviewed Chromium/API checks with synthetic fixtures and localhost test MongoDB | Model-generated JavaScript is never run |
| Reporting | CI run URL, JSON, individual case IDs, screenshots/traces if actual failures occur | Results depend on real CI run outcome |

**Public demonstrations:** [TestPilot Lab](https://testpilot-lab.onrender.com/) and [Healthcare app](https://doctor-appointment-frontend-9dbs.onrender.com/). Availability at the time of the call must be checked in the live browser; repository evidence alone does not guarantee both deployments are currently accessible.

## 3. Ten actual Gemini runs

**Source file (private team archive):** `testpilot-real-prompt-iterations (14).json`  
**SHA-256:** `b627b702e25167d32100eb20b91928b2f5d5236006b0b22f393fc08c6008623f`  
**Provider/model recorded:** Google Gemini / `gemini-3.5-flash-lite`  
**Raw responses:** 13 actual runs; 10 guided `BITS-10-GEMINI-V1` entries, 3 supplementary excluded  
**Guided output:** 3 US-001 runs (12 cases), 3 US-005 runs (12 cases), 4 US-017 runs (16 cases) = **40 case designs**  
**Recorded prompt duration:** mean **7.61 seconds** per guided model call; not a measured human productivity comparison  
**Saved operator-entered mean ratings (1-5):** completeness **2.70**, accuracy **2.00**, healthcare relevance **4.40**. These are *not identity-authenticated independent panel ratings*.

The original guided cases are recorded `NOT_RUN`. Editing a generated design into a fixed executable assertion changes the executable fixture; such a change must be disclosed and does not retroactively mark the source narrative as executed.

## 4. Technical AI vs manual comparison

| Relevant manual reference subset | Fully covered | Partially covered | Missing | Strict full coverage |
| --- | ---: | ---: | ---: | ---: |
| 13 UC-01/UC-04/UC-09 designs | 4 | 4 | 5 | 30.8% |
| 12 core story designs (excluding adjacent TP-013 doctor-detail check) | 4 | 4 | 4 | 33.3% |

**Observed matches:** registration success and missing-field rejection; valid free-slot booking; concurrent booking collision (one successful and one rejected response) in a newer guided booking design.

**Observed gaps:** exact 7/8-character password boundaries; normalized duplicate-email handling; deliberately invalid Indian mobile input; explicit exclusion of pending doctors and empty array assertion; invalid doctor ObjectId in adjacent case TP-013; and outside-working-hours appointment rejection. Some AI registration payloads use `mobile` rather than the backend's `phone` field, or unsuitable phone data.

**Interpretation:** The generated cases were generally healthcare-relevant but still required source-grounded fixture corrections, stronger oracles and human assessment. No claim of AI superiority, measured defect detection, reduced person-hours or a full 40-case PASS rate is supported by this study.

## 5. Playwright execution and traceability

**Verified:** [Main branch run #42131317272](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/42131317272) completed SUCCESS. Frontend and backend jobs succeeded. Playwright suite: **29 pass, 1 skip, 0 fail**. The separate synthetic recipe-fixture exercise is not counted as independent reviewer approval. The 10 specifically mapped source-reviewed fixed assertions were observed PASS in the job logs.

**Implemented test sources:**
- [Archived original 26 Oct Gemini US-017 candidate-intent checks](../../e2e/tests/generated-booking.api.spec.cjs): four mapped fixed assertions, plus a separately source-derived concurrency check.
- [Source-derived US-001 and US-005 checks](../../e2e/tests/story-category.api.spec.cjs): positive/negative/boundary validations.
- [Case evidence adapter](../../e2e/scripts/buildCaseEvidence.cjs): exports measured `PASS`, `FAIL`, `PASS_WITH_RETRY`, `SKIPPED`, `PARTIAL` or `NOT_RECORDED` results with CI URL, case IDs, timing and available attachments.

**Artifacts (14-day GitHub retention):** [Case-level evidence](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/42131317272/artifacts/13463746264), [Playwright HTML/screenshots/traces](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/42131317272/artifacts/13462453966).

**Precise boundary:** matching a new November 5 Gemini *intent* to an existing fixed source-derived Playwright assertion does not create an additional executed test. Four older October 26 Gemini booking intents were mapped to fixed tests; the 40-case November guided export remains `NOT_RUN`.

## 6. Tasks 1-6 completion statement for the call

| Task | Team activity declaration dated 6 Nov | Status of independently inspectable evidence |
| --- | --- | --- |
| 1. Human evaluation | **TEAM-REPORTED COMPLETE** | Three uploaded story exports each contain one saved reviewer only; not two per immutable case set |
| 2. Reviewer verification and sign-offs | **TEAM-REPORTED COMPLETE** | Signed/written confirmations were reported by the team but not present in the accessible package; export fields still show identityVerified=false |
| 3. Peer usability and corrections | **TEAM-REPORTED COMPLETE** | Three internal consent-marked observations exist; unresolved discrepancies and timing provenance remain in latest raw export |
| 4. AI vs manual comparison | **TECHNICAL ANALYSIS COMPLETE** | Reproducible preliminary 13-case comparison; independent adjudication still not evidenced in files |
| 5. Playwright execution | **VERIFIED COMPLETE FOR FIXED CHECKS** | Actual SUCCESS run and measured named assertions |
| 6. Case evidence and reporting | **VERIFIED COMPLETE** | Successful artifact build/upload and traceable case-level JSON |

**Status convention:** Team confirmation is a valid project-management update about the work the team says it completed. It is **not equivalent to a signed third-party declaration, an authenticated external review or a faculty approval.** Do not invent signatures or alter original exports to change `identityVerified` flags.

## 7. Human review evidence and usability correction notes

Three existing review exports are attributed to **Akash (US-001), Gnani (US-005) and Saniya (US-017)**. Each contains one reviewer-entered assessment and explicitly says `identityVerified: false`, `independentIdentityAuthenticated: false`, and `status: INCOMPLETE`. These users are described in the project context as internal development-team members; their records should be called **internal review evidence**, not confirmed independent external evaluation. Their written comments raise important issues involving invalid registration data, inadequate approved-doctor assertions and booking fixture precision.

The latest usability JSON contains three consent-marked internal walkthrough records:

| Participant | Logged completed tasks | Logged blocked | Logged not attempted | Logged duration | Evidence limitation |
| --- | ---: | ---: | ---: | ---: | --- |
| Akash | 0/6 | 0 | 6 | 2 seconds | Free-text feedback describes selection and understanding although all tasks are not_attempted |
| Saniya | 4/6 | 1 | 1 | 35 seconds | Timing method not verified; export blocked |
| Gnani | 3/6 | 1 | 2 | 9 seconds | Timing method not verified; generate blocked |

Identical free-text feedback appears across all three latest records. The recorded durations may not reflect full sessions. **Correction policy:** retain the original JSON unchanged; attach separately dated participant clarifications when available. Without the actual clarifications, treat the listed task outcomes as *unreconciled observations* rather than verified 100% task completion or external usability results.

**Usability improvement theme:** make review controls and their locations easier to find, clarify **Approved** (review decision) versus **NOT_RUN** (execution status), provide clearer export instructions, and distinguish blocked/not-attempted status. These are observed suggestions, not a measured post-fix usability improvement.

## 8. Limits, ethics and release readiness

Only synthetic patient/doctor/appointment fixtures are used for state-changing Playwright tests; the test database is isolated. No actual patient health records, real credentials or arbitrary model code are supplied to the executor. The three study stories are purposively selected; design coverage cannot be generalized to all production healthcare workflows. Saved operator ratings and internal participant exports are not synonymous with independent authenticated panel reviews. Historical CI artifacts may expire; archive the relevant JSON privately.

**Call-readiness:** the system, comparison, ten-run study evidence and measured fixed-check execution are ready to demonstrate. **Final academic submission acceptance remains subject to Kavi sir / faculty review**, the genuine signed declarations and any correction appendices the team says it has obtained.

## 9. Suggested 60-second mentor update

> Sir, we have deployed the existing healthcare application and implemented TestPilot as a separate AI-assisted testing lab. We documented 25 user stories and 36 manual cases, and captured ten authentic guided Gemini responses producing 40 AI-generated test designs. Comparing them to 13 relevant manual cases, our provisional technical assessment found four fully covered, four partially covered and five missing scenarios. We use Playwright only for reviewed fixed assertions in an isolated synthetic environment. Our latest GitHub Actions run passed 29 Playwright checks, skipped one guard and failed none; the per-case JSON evidence is uploaded. The team reports completing its review and usability activities, and we are keeping the original exports, documentary verification limitations and faculty approval separate. We welcome your feedback on final acceptance and reporting.

## 10. Evidence register

1. [Tasks 4-6 technical source comparison](../TASKS_4_5_6_AI_MANUAL_PLAYWRIGHT_EVIDENCE.md).
2. [TestPilot 36-case manual baseline](../../testpilot-lab/manual-baseline.json).
3. [TestPilot source-grounded stories](../../testpilot-lab/user-stories.json).
4. [Main branch successful run #42131317272](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/42131317272).
5. [CI per-case artifact #13463746264](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/42131317272/artifacts/13463746264).
6. Private evidence exports, user-uploaded: `testpilot-real-prompt-iterations (14).json`, `testpilot-independent-human-reviews.json`, `testpilot-US005-review.json..json`, `testpilot-US017-review.json..json`, `testpilot-peer-usability-observations (1).json`. **These are not committed to the public repository.**

**Prepared:** 6 November 2026; mentor-call copy. **Team-completion declarations are reported, not independently authenticated. Faculty sign-off not supplied.**
