# TestPilot final three-gap implementation and evidence checklist

**Date:** 31 October 2026. **Course:** BITS Pilani BSDCH ZC229T.

This file distinguishes **working software for collecting evidence** from **evidence that only independent human participants can produce**. Do not mark the project fully reviewed merely because a browser test clicked the forms.

## 1. Independent two-reviewer evaluation and peer usability

**Implemented:** the Lab has a separate "Independent reviews and peer usability sessions" section. Each reviewer independently scores the original AI candidate set against the same documented acceptance criteria for both the AI and frozen manual baseline. Each covered/not-covered decision must cite case IDs and steps. The server checks the source generation receipt, SHA-256 case-set hash, identical criteria, and distinct self-declared reviewer identifiers. The side-by-side disagreement report explicitly retains any unresolved conflict, **never manufactures sign-off**, and can be exported for the faculty study.

A separate timed, consent-required usability recorder captures participant initials, browser/device, six actual task outcomes, elapsed seconds, and specific observed feedback, then exports a JSON study bundle. There is deliberately no automated creation of human session entries or simulated participants; participants have to operate the interface. IDs are **self-declared**, not identity-provider authenticated; faculty sign-off must be obtained outside the app.

**Actual independent team reviews and peer sessions are not yet documented as completed.** To complete:
1. Generate a real LLM case set and keep the page open while its short-lived signed receipt is valid.
2. Reviewer A enters and submits their *own* case-ID-specific assessment; reviewer B enters their *independent* assessment of that same output. Export and resolve disagreements with written rationale and actual sign-off.
3. With consent, have at least two peer participants start the observation timer, perform the six displayed tasks, record each actual outcome and feedback, and export the sessions.
4. Include the two real human exports and resolution notes in the faculty submission.

## 2. Execute approved generated scenarios safely, without arbitrary code execution

**Implemented:** approved AI candidate cards include a mapping to a **fixed, source-reviewed executable recipe**. The Lab exports `reviewed-isolated-plan-v1` JSON, and a separate [manual isolated GitHub Actions workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/reviewed-generated-isolated.yml) accepts that JSON as its `plan_json` input. The Playwright runner executes the chosen test **against the actual, existing Express healthcare app deployed inside the ephemeral CI job**, with synthetic MongoDB records, real HTTP assertions and actual per-case pass/fail reports.

Covered recipe types:
- US-001: valid registration; weak password; exactly-eight-character boundary.
- US-005: approved doctor filtering; empty directory.
- US-017: valid booking; conflict/duplicate; missing fields; no authentication; concurrent bookings; out-of-hours.

These are **eleven reviewed scenario execution templates**, not an unrestricted natural-language interpreter. A generated case must be explicitly marked APPROVED and mapped to a matching story-specific reviewed recipe. An unsupported case is **NEEDS_IMPLEMENTATION**, not PASS. The test runner rejects freeform URLs, JavaScript, shell commands and unexpected manifest keys and refuses to connect to any database other than `mongodb://127.0.0.1:27017/testpilot_generated_test`. There are no live patient data or production writes.

### Faculty demonstration
1. In the Lab, generate and inspect real AI candidates, edit expected results/steps, approve the appropriate cases and save the signed review.
2. Map each approved case to a reviewed recipe, enter the real reviewer's initials, and click **Copy plan JSON**.
3. In GitHub Actions open **Reviewed AI scenarios - isolated execution**, click **Run workflow**, paste the JSON into `plan_json` and run on `main`.
4. Open that specific run's job, read the measured Playwright case titles and **PASS / FAIL** statuses, and download `reviewed-generated-scenario-evidence` for HTML reports and traces.
5. Disclose that the execution validates the reviewed recipe associated with a generated case, **not arbitrary execution of its prose steps**. Do not claim all 25 stories are executable yet.

A synthetic fixture `e2e/fixtures/reviewed-plan.synthetic.json` verifies six **nonhuman** booking recipes in the standard CI run. It is test infrastructure only; **not a real QA approval or proof of an actual LLM run**.

## 3. Failure screenshots and results dashboard

**Implemented:** the authenticated GitHub Actions report converter checks Playwright output for an **actual failed test's PNG attachment** and attaches one bounded PNG (maximum 120 KB) to the signed test-run submission. The backend validates PNG format, restricts it to failing Playwright Chromium results, stores it with the case, and serves a safe inline data URI. The separate Lab displays an image preview beneath its failed-case result and an evidence link to the exact GitHub Actions run; the full HTML report, remaining screenshots and traces are available from that run's artifacts. The frontend has been updated with a limited `img-src data:` Content Security Policy.

**Evidence status:** the 26 passing legacy Playwright tests have **no legitimate failure screenshots**. There is a deliberately synthetic browser/UI test and backend unit test for the failure-image path, but those do not prove a real product defect. When a genuine isolated failure occurs within the size limit, the Lab will display its actual screenshot; for API-only failures or oversized captures, it displays an honest absent-image message with the complete CI artifact link.

The report is retained by GitHub Actions for 14 days; do not treat artifact expiration as a persistent screenshot archive.

## Scope and academic integrity

- The original BITS proposal excludes CI/CD as a **project feature**; GitHub Actions is an internal test/evidence runner, not a newly proposed product deliverable.
- Every AI candidate remains NOT_RUN until a directly traceable supported assertion is actually executed.
- **Peer sessions and independent reviews require real humans.** Never auto-fill their identities, ratings, times or conclusions.
- **Unrestricted arbitrary AI code execution is intentionally prohibited.** If faculty requires a broader safe executable DSL, add new reviewed recipe contracts and maintain the same isolated environment.
- The standalone Lab uses browser-session data and exports, not a shared persistence/identity-backed research database. Preserve all faculty evidence exports separately.

## Verification links

- [Proposal acceptance map](./BITS_PROPOSAL_ACCEPTANCE_AND_STUDY_PROTOCOL.md)
- [Original genuine Gemini booking case traceability](./WEEK7_GEMINI_PLAYWRIGHT_EVIDENCE.md)
- [CI regression workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/testpilot-ci.yml)
- [Manual reviewer-mapped AI scenario workflow](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/reviewed-generated-isolated.yml)
