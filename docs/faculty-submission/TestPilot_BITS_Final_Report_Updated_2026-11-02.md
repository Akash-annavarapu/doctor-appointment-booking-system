# TestPilot — BITS Pilani Final Project Report (Updated 2 Nov 2026)

> **Source:** Updated user-provided November 2026 Word document. This is a searchable, Git-versioned textual transcription of the report; a separate build step publishes Word and PDF renderings. Original evidence labels are preserved. **Not an approved or signed academic finding.**

TestPilot — BITS Pilani Design Project Report (Evidence Draft)

BITS PILANI  |  BSDCH ZC229T  |  TESTPILOT

BIRLA INSTITUTE OF TECHNOLOGY & SCIENCE, PILANI
Work Integrated Learning Programmes Division
BSc Design and Computing
BSDCH ZC229T · Design Project

TestPilot
AI-Assisted Test Case Generation for a Full-Stack Healthcare Platform

PROJECT REPORT — PRE-SUBMISSION EVIDENCE DRAFT

Reporting date: 31 October 2026
Project mentor: Kavi Arasu V
Academic duration: 8 weeks (fixed)
Team: [Insert verified student names and student IDs]

Submission status: technical implementation and tests verified; required real LLM study, independent participant assessments and final faculty validation remain outstanding. This document deliberately contains no invented experimental observations.

Abstract
TestPilot is a separate web-based tool designed to assist quality assurance engineers in generating, reviewing, and evaluating structured software test cases for an existing open-source healthcare appointment application. The project deploys and tests the reference application rather than recreating it. TestPilot accepts source-grounded patient, doctor and administrative user stories, requests structured cases from an LLM, supports editing and approval decisions, and maps supported approved scenarios to isolated Playwright verification. The system maintains a manual test baseline and records measured regression outcomes, with evidence links and constrained failure screenshots. As of 31 October 2026, the repository contains 25 documented stories spanning 15 use cases, a 36-case manual baseline, and a successful main-branch Playwright run comprising 28 passed tests and one intentionally skipped safeguard test. Six synthetic reviewer-recipe checks also passed. A controlled AI-versus-manual study, ten genuine prompt iterations with reviewer scores, and independent usability sessions must still be completed before final empirical conclusions can be reported.
1. Problem statement and objectives
Manual test design is time-intensive, particularly for role-based systems with authentication, appointment availability, data validation, and state transitions. LLM-generated cases may accelerate initial design but can also miss boundaries, invent unsupported behaviors or provide ambiguous expected results. The project examines AI-assisted test design while retaining human oversight.
Deploy and analyze an existing healthcare application and document at least 15 user stories across patient, doctor and admin roles.
Generate positive, negative and edge/boundary test scenarios using a documented prompt engineering layer.
Allow a QA reviewer to inspect, edit, approve or reject model suggestions before execution.
Run approved, implementable scenarios in a safe isolated testing environment and display measured results.
Compare genuine model-generated and manually designed cases using independent human evaluations and traceable evidence.
2. Project scope and technical implementation
The healthcare application under test is a pre-existing React/Vite frontend and Express/Node.js backend with MongoDB persistence; TestPilot is separate. The deployed components are linked from the evidence register. The practical application frontend uses Bootstrap rather than the proposal’s reference to Redux Toolkit/Tailwind CSS; the separate TestPilot frontend uses HTML/CSS/JavaScript with a Node HTTP server. Those deviations should be acknowledged to faculty as technology selections, not misrepresented as identical to the reference stack.
	Module
	Implemented role
	Boundary

	Healthcare AUT
	Browsing, registration, booking, doctor/admin feature flows
	Existing app, synthetic data in tests

	LLM prompt layer
	User stories, four audited variants, structured 4–8 cases
	Real model access needs private API key/quota

	Review workspace
	Edit, approve, reject, note gaps, export decisions
	Shared-code identity not independent authentication

	Playwright runner
	Eleven fixed source-reviewed recipes across three stories
	No arbitrary LLM code; localhost isolated MongoDB

	Reporting
	PASS/FAIL, case IDs, CI evidence URLs, bounded failure PNG
	Screenshot only when real browser failure captured


3. Study design and reproducibility
The proposed academic comparison uses three purposively selected user stories: US-001 (registration), US-005 (doctor browsing) and US-017 (appointment booking). For each story, the 36-case manual baseline remains frozen, and genuine model suggestions are evaluated against the same source-grounded acceptance criteria. Reviewer decisions distinguish Covered, Not covered and Not reviewed; criterion counts must disclose the number unreviewed. Two independent reviewers should cite candidate IDs and steps and resolve disagreements through documented discussion. Scores for completeness, accuracy and healthcare relevance are each 1–5 and must be entered by actual reviewers, not inferred from automation.
The prompt-engineering study requires ten actual calls covering all three stories. Each retained record must contain story input, prompt variant, reason for the change, model, UTC timestamp, unedited LLM response, measured generation duration, human ratings and reviewer observation. The app supplies the experiment capture interface; no verified completed ten-run dataset was available in the inspected repository at authoring time.
4. Verified technical results (2 November 2026)
	Evidence item
	Observed result
	Source

	Documented requirements
	25 stories, 15 use cases
	testpilot-lab/user-stories.json

	Manual comparison baseline
	36 test cases
	testpilot-lab/manual-baseline.json

	Isolated reviewer-recipe verification
	6 passed; synthetic, not human-approved
	Main-branch CI job logs

	Playwright regression suite
	29 passed, 1 intentionally skipped, 0 failed
	GitHub Actions #41327612679

	Frontend and backend checks
	Both successful in same main-branch workflow
	GitHub Actions #41327612679

	Original Gemini case mapping
	Four US-017 AI candidate intents mapped to fixed assertions
	WEEK7_GEMINI_PLAYWRIGHT_EVIDENCE.md


The six recipe tests are separately invoked in the same CI workflow and should not be added blindly to the 29-test suite figure as an independent count of distinct test cases. Reported PASS statuses refer to actual isolated assertions. The intentionally skipped check exercises the no-approved-plan safety boundary.
5. AI-assisted versus manual test-case evaluation
An internal evidence record dated 26 October 2026 (TestPilot_AI_Comparison_2026-10-26.md) documents 12 genuine Gemini candidate cases across US-001, US-005 and US-017, compared with 13 manual baseline cases. Its provisional assistant-scored coverage was 4 of 6 acceptance criteria for AI and 6 of 6 for manual design. This is a useful exploratory finding, NOT an independently confirmed human evaluation or evidence of ten prompt iterations. The archived US-017 output did not include the later requirement-derived concurrency edge scenario; the sampled AI outputs also contained incomplete doctor-filtering assertions and potentially invalid synthetic registration phone inputs.
	User story
	Gemini designs
	Manual cases
	AI preliminary criteria
	Manual preliminary criteria

	US-001 registration
	4
	6
	2 of 2
	2 of 2

	US-005 doctor browsing
	4
	3
	0 of 2
	2 of 2

	US-017 booking
	4
	4
	2 of 2
	2 of 2

	TOTAL
	12
	13
	4 of 6
	6 of 6


These provisional criteria are from an earlier assistant assessment of generated steps and manual scenario titles; actual reviewers must independently validate each judgment, especially cases with weak or confounded test data. No AI superiority, time-saving percentage, or definitive comparative accuracy is claimed.
	Metric
	Valid reporting rule
	Current status

	Criterion coverage
	Covered / (Covered + Not covered), disclose unreviewed
	Not yet faculty-validated

	Test design quality
	Human 1–5 scores, evidence-based written justification
	Awaiting genuine scores

	Generation time
	Measured provider response duration per actual run
	Ten-run study pending

	Human review time
	Measured independent reviewer durations
	Peer study pending

	AI candidate execution
	Case ID → approved recipe → CI run → PASS/FAIL
	Verified for supported mapping only


6. Security, privacy and ethical considerations
No real patient data are required or authorized for test execution; synthetic patients, doctors and appointments are used in an isolated local MongoDB database.
Model-authored scripts, URLs and arbitrary commands are not executed directly. Reviewed case intents can be mapped only to fixed, code-reviewed Playwright recipes.
Generation receipts and review decisions are checked before supported execution; a shared access code does not independently prove reviewer identity.
Failure screenshots are captured only from real failed isolated browser tests, with bounded image size and source-linked artifacts.
Peer feedback is collected with informed participant consent; real participation and sign-off must not be simulated.
7. Ten-iteration prompt engineering plan
The following table is the controlled experimental protocol and NOT a record of ten completed model calls. Each row becomes evidence only when a real response and human scoring record is attached.
	Run
	Story
	Variant
	Comparison focus
	Evidence

	01
	US-001
	Baseline
	Initial registration coverage
	PENDING

	02
	US-001
	Boundary
	7/8-character password conditions
	PENDING

	03
	US-001
	Assertions
	Verifiable registration outcomes
	PENDING

	04
	US-005
	Baseline
	Initial approved directory
	PENDING

	05
	US-005
	Boundary
	Empty directory and missing records
	PENDING

	06
	US-005
	Assertions
	Observable directory contract
	PENDING

	07
	US-017
	Baseline
	Pending booking happy path
	PENDING

	08
	US-017
	Boundary
	Missing fields / unavailable slot
	PENDING

	09
	US-017
	Authorization
	Anonymous booking denial
	PENDING

	10
	US-017
	Assertions
	HTTP 201/409 and persisted state
	PENDING


Required per iteration: model/provider, exact story prompt and changed instruction, UTC time, original candidate JSON, number and categories of cases, generation duration, reviewer identity, 1–5 ratings (completeness/accuracy/healthcare relevance), specific rationale, review duration and signed approval/remarks.
8. Independent review and peer usability
Each independent reviewer should inspect the same immutable AI case set and separately rate both AI and manual cases against every acceptance criterion. Disagreements require a documented resolution. At least two consenting peer participants should complete the core workflow and provide measured task completion and usability feedback. The software has forms and validation for those activities; actual participant records remain pending.
	Human evidence
	Required record
	Status

	Reviewer A
	Case-set hash, per-criterion AI/manual judgment, cited steps, initials
	PENDING

	Reviewer B
	Same source set, independent judgments, initials
	PENDING

	Disagreement resolution
	Each conflict, decision and rationale signed by reviewers
	PENDING

	Peer session 1
	Consent, measured task outcomes, feedback, duration
	PENDING

	Peer session 2
	Consent, measured task outcomes, feedback, duration
	PENDING


9. Proposal acceptance and remaining validation
	Proposal milestone
	Assessment as of 2 November 2026

	Existing healthcare deployment, 15+ stories
	IMPLEMENTED (25 stories; existing app)

	Prompt layer and LLM test candidates
	IMPLEMENTED; real 10-iteration study not evidenced

	Human case edit/approve/reject
	IMPLEMENTED in the Lab

	Approved test execution and dashboard
	IMPLEMENTED for fixed reviewed scenarios; screenshots when available

	Ten scored real experiments
	OUTSTANDING: genuine outputs and scores

	Independent case evaluation
	OUTSTANDING: two participants and resolutions

	Peer usability
	OUTSTANDING: observed consenting sessions

	Faculty-approved final empirical conclusions
	OUTSTANDING: team and mentor validation


10. Discussion, limitations and conclusion
The implementation demonstrates the feasibility of combining structured LLM output with a controlled human-approval workflow and Playwright-based verification for a healthcare application. Its strongest completed contribution is source-grounded traceability and safe deterministic execution in an isolated environment, supported by successful CI results. The principal methodological limitations are the restricted set of executable recipes, lack of authenticated reviewer identities, browser-session-based experiment storage, prompt/API quota dependency, and absence of a completed independent human empirical study.
The prototype is technically ready for a controlled demonstration. It is not yet justified to claim that LLM test design is faster, more accurate or more complete than manual design, or that all faculty outcomes are achieved. Completing the ten authentic experiments and participant assessments, and attaching the evidence to this document, will permit final academic evaluation. These steps are human evidence collection tasks rather than software implementation defects.
References and traceable artifacts
BITS Pilani WILP. BSDCH ZC229T Design Project – supplied project proposal (primary acceptance contract).
Copeland, L. (2004). A Practitioner’s Guide to Software Test Design. Artech House.
Playwright documentation: https://playwright.dev/docs/intro
OpenAI Prompt Engineering Guide: https://platform.openai.com/docs/guides/prompt-engineering
TestPilot repository: https://github.com/Akash-annavarapu/doctor-appointment-booking-system
Verified main-branch run: https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/41327612679
Faculty protocol: docs/BITS_PROPOSAL_ACCEPTANCE_AND_STUDY_PROTOCOL.md
Peer-study evidence: docs/PEER_REVIEW_SAFE_EXECUTION_SCREENSHOT_HANDOFF.md
Archived booking mapping: docs/WEEK7_GEMINI_PLAYWRIGHT_EVIDENCE.md
Appendix A. Final validation and sign-off checklist
	Validation check
	Evidence identifier / sign-off
	Status

	10 real LLM responses across ≥3 user stories
	[Attach JSON export, hashes, date]
	PENDING

	All 10 responses scored by real humans
	[Attach score sheet and reviewer notes]
	PENDING

	Two independent AI/manual evaluations
	[Attach comparison exports]
	PENDING

	Disagreements adjudicated
	[Attach rationale and both initials]
	PENDING

	Two consent-based peer usability sessions
	[Attach session records and evidence]
	PENDING

	CI pass/fail evidence
	GitHub Actions #41327612679
	VERIFIED

	Final mentor acceptance
	[Date, mentor signature/approval]
	PENDING


Do not replace pending entries with guessed outcomes. Evidence should be independently verifiable and restricted to synthetic healthcare records.
Appendix B. Evidence reconciliation (2 November 2026)
The current published TestPilot Lab deployment is live at https://testpilot-lab.onrender.com/. Render reports commit 042e14ae (guided ten-run experiment and per-iteration review interface) deployed successfully on 1 November 2026. GitHub main-branch workflow 41327612679 completed successfully: 29 Playwright tests passed, zero failed and one intentionally skipped guard. The six separate synthetic reviewed-case recipe checks also passed. These are genuine automated engineering outcomes, not results of the required human experiment.
A historical study record from 26 October 2026 documents 12 real Gemini-generated candidates across the three target user stories (four each). It compares them with 13 manual designs and reports a preliminary AI assessment of 4/6 acceptance criteria covered versus 6/6 in the manual baseline. This remains assistant-reviewed exploratory evidence; it does not count as ten separate prompt iterations and it has not been independently validated by two humans.
At this review, no authenticated export proving all ten fresh Gemini iterations with participant-entered 1–5 ratings was available. No complete two-reviewer per-story exports, no verified consent-based peer observation exports and no signed mentor approval were supplied. Accordingly, the empirical analysis remains pending and the report is a PRE-SUBMISSION DRAFT.
Appendix C. Required closure artifacts
	Deliverable
	Evidence to attach
	Current verified status

	Ten real Gemini iterations
	Export from Lab study runner; UTC timestamps, prompt variants, original outputs
	NOT VERIFIED

	Ten human quality ratings
	Three 1–5 ratings and written case-specific observation per run
	NOT VERIFIED

	Independent AI/manual reviews
	Two genuine reviewers per story; matching case-set evidence, cited steps, conflict resolutions
	NOT VERIFIED

	Peer usability
	Two consenting participants; observed tasks, measured duration, feedback
	NOT VERIFIED

	Final faculty approval
	Mentor confirmation, date, final report revision
	NOT VERIFIED

	Technical CI
	GitHub workflow 41327612679; 29 Playwright pass, one skip
	VERIFIED


Only replace “NOT VERIFIED” after reviewing original provider or participant records. A synthetic browser fixture or AI-authored judgment cannot be submitted as independent human validation. The report is not an assertion of project acceptance by faculty.
TestPilot · Evidence-based pre-submission report  |  Page
