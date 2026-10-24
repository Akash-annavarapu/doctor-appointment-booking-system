# TestPilot Lab — standalone testing application

**Deployed independently on Render:** https://testpilot-lab.onrender.com/  
**Render workspace:** My Workspace; service testpilot-lab; free plan; branch main; auto-deployment enabled.


**A second application** distinct from the existing deployed healthcare application. Its Node.js server hosts its own UI and API without external NPM dependencies.

## How it fulfills Kavi sir's Step 2

1. Paste the existing healthcare URL https://doctor-appointment-frontend-9dbs.onrender.com/.
2. Select from 25 documented user stories (or edit the story text). Stories contain role, use case, source-code anchor, API path and acceptance criteria.
3. Click Inspect live application to read the public HTML and approved-doctor catalog from the exact approved hosts.
4. When configured with a free-tier Google Gemini key (or explicitly chosen OpenAI), use Generate AI test cases. Model receives the story, route and safe public inspection evidence and returns 4–8 reviewable test cases.
5. Export JSON for review. Generated cases initially remain NOT_RUN. The optional approval flow may execute only **source-reviewed read-only GET probes linked to selected AI cases**; other cases remain SKIPPED until an isolated test environment is available.

Only the allowlisted healthcare deployment can be inspected: arbitrary domain crawling and localhost access are blocked to prevent SSRF. Public HTML cannot prove the behavior of authenticated booking screens.

## Local run

Requires Node.js 22 or newer. No dependency installation needed.

    cd testpilot-lab
    npm test
    npm start

Open http://localhost:5050/.

## Render deployment configuration

This separate service has been created on Render, pointing at the same GitHub repository, without changing the existing healthcare frontend/backend services.

- Root Directory: repository root (the live service currently has this field empty)
- Runtime: Node.js
- Build command: `cd testpilot-lab && npm install --omit=dev`
- Start command: `cd testpilot-lab && npm start`
- Health check path: currently unset in Render (the application exposes `/healthz` and the live-smoke workflow verifies it)
- Free-tier variables: AI_PROVIDER=gemini, GEMINI_API_KEY and LAB_ACCESS_CODE (at least 16 random characters); optional GEMINI_TEST_MODEL=gemini-3.5-flash-lite. OpenAI remains optional and must be explicitly selected.

No API key is stored in this repository or returned to the browser. Lab inspection works without an AI key. AI generation accurately returns HTTP 503 until configured. A private lab access code and basic throttling prevent open-ended anonymous API usage. For wider production rollout, upgrade to managed authentication and persistent rate-limiting.

## Endpoints

- GET /healthz — liveness
- GET /api/stories — 25 source-grounded user stories
- POST /api/inspect — request body: {"targetUrl":"https://doctor-appointment-frontend-9dbs.onrender.com/"}
- POST /api/generate — request body: {"targetUrl":"...","storyId":"US-017","storyText":"As a patient...","accessCode":"..."}

The generated cases include id, title, type, priority, preconditions, steps, testData and expectedResult, always reviewed=false, executionStatus=NOT_RUN.

## Roadmap

- Week 5: user stories, source traceability, progress documentation and separate Lab UI.
- Next: configure a free-tier Gemini key and existing Lab access code privately, verify a genuine generated set and human review, then extend **isolated** execution for state-changing workflows.
- Phase 3: execute approved tests in isolated CI against synthetic fixtures/test database, collect measured results and show PASS/FAIL. Never run LLM-generated code directly on production Render or create real appointments as a smoke test.

Further reading: docs/WEEK5_USER_STORIES.md and docs/WEEK5_PROGRESS_REPORT.md.


## Real execution evidence (limited and safe)

The Lab now includes a Stage 3 **Verified live checks** panel. For eligible stories (US-003, US-004, US-005, US-006, US-007, US-010, US-019, US-020, US-025), the fixed server-side test engine sends only GET requests to the known healthcare frontend/backend and measures contract assertions such as React root, approved doctor list, public slots, or missing-session authorization. The results show actual PASS, FAIL, or SKIPPED with timestamps, run IDs, durations, and JSON export.

For the other stories, this panel explicitly reports SKIPPED: real patient registration, appointment creation, doctor status updates and admin mutations must only be automated against a **separate test environment and synthetic fixtures**, not the public production deployment. These read-only probes are source-reviewed checks **associated with** stories; they are NOT the execution of model-generated test scripts and do not prove the entire story passed.

A separate **Latest measured CI runs** panel reads GET /api/ci-results, which proxies summarized existing healthcare Jest/Vitest run data from the backend reporting API. These are actual, pre-existing Static-CI tests run in an isolated GitHub Actions MongoDB test database, not AI-generated tests.

- GET /api/probes?storyId=US-005 — list allowlisted test assertions applicable to a story.
- POST /api/execute — {"storyId":"US-005","targetUrl":"https://doctor-appointment-frontend-9dbs.onrender.com/"}; runs only pinned GET probes (basic IP throttling).
- GET /api/ci-results — latest measured static CI report summaries.

Generated AI cases remain review-required, NOT_RUN. Do not combine a passing probe with an unrelated generated candidate as a claim of passing the entire generated case.

## Approved execution of LLM-generated cases (limited scope)

With a private GEMINI_API_KEY and LAB_ACCESS_CODE configured (AI_PROVIDER=gemini), /api/generate returns 4–8 LLM-generated cases. The model must assign each case a probeId: an applicable ID from that story's fixed, audited, read-only GET checks, or NONE where the scenario cannot be safely executed against production.

- The Lab validates every proposed probeId against the selected story. For bound checks, the app supplies the source-reviewed expected assertion instead of accepting a model-invented expectation.
- Each generation response includes a 30-minute, server-signed receipt binding the exact story, allowed healthcare URL and generated case contents. Tokens expire and are invalidated by restart.
- Users explicitly approve cases using UI checkboxes. POST /api/execute-generated requires LAB_ACCESS_CODE, the original receipt, all unchanged generated cases and selected AI case IDs.
- The executor only runs allowlisted GET assertions. It never evaluates LLM JavaScript, sends credentials, creates appointments, changes doctor records or performs writes on the public healthcare site.
- Each bound AI case gets measured PASS/FAIL for the associated read-only assertion only; unsupported AI cases are SKIPPED. The result does NOT establish that the entire generated narrative scenario passed.

POST /api/execute-generated accepts targetUrl, storyId, accessCode, receipt, the unchanged cases array, and selectedIds such as ['AI-001']. The generation receipt is not a substitute for authentication.

**Still needed for full milestone 3:** A disposable staging deployment with synthetic patient/doctor/admin fixtures, dedicated test MongoDB, reviewed test oracles and a runner for state-changing or UI workflows. The production deployment must not be used for these tests. Live LLM generation requires a free-tier Google Gemini key configured in Render (subject to applicable quotas). Paid OpenAI is optional and disabled by default.


## Instructor-ready status (19 October 2026)

**Live Lab deployed on Render:** latest code containing approved generated-case read-only execution was redeployed successfully. The Lab is independent of the healthcare application: it accepts an allowlisted healthcare URL plus a source-grounded user story and supports inspection and safe public verification without a model key.

**AI generation requires operator setup:** In Render's *testpilot-lab* service → **Environment**, set a free-tier `GEMINI_API_KEY`, set `AI_PROVIDER=gemini`, and retain a separate `LAB_ACCESS_CODE` (at least 16 characters). Do not commit these values or put an API key into the frontend. The Lab input form accepts only the **Lab access code**, never an OpenAI key. After saving, verify actual generation with a documented user story before claiming end-to-end AI functionality. A Gemini API free-tier project can generate limited test cases without an API billing account; free-tier quotas and data-use terms apply.

**Execution boundary:** Generated cases are suggestions requiring review; only explicitly approved cases mapped to audited read-only GET checks can be partially executed on the public healthcare service. No generated mutation code, real credentials, patient data, or booking writes are executed on production.

See [instructor checklist](../docs/KAVI_SIR_CURRENT_MILESTONE_CHECKLIST.md).

## Checking AI readiness without exposing private credentials

The home page displays a nonsecret readiness notice. `GET /api/capabilities` reports the active provider, a Boolean `aiGenerationReady`, the count of supported source-grounded stories, and the restricted read-only execution scope. **Configured** does not mean that a live OpenAI generation has been verified.

To enable genuine LLM generation:

1. In [Google AI Studio](https://aistudio.google.com/api-keys), create a free-tier Gemini API key. **Do not select Set up billing or upgrade to a paid tier** for this academic demonstration.
2. Open the **testpilot-lab** Render service → **Environment** and set `GEMINI_API_KEY` privately. Set `AI_PROVIDER=gemini` and optionally `GEMINI_TEST_MODEL=gemini-3.5-flash-lite`.
3. In the same Render Environment page, set `LAB_ACCESS_CODE` to a separate random secret of at least 16 characters. Do not reuse your Gemini key for this field.
4. Save the variables and wait for the service to redeploy. Refresh the Lab home page; the readiness notice should say generation is configured.
5. In the Lab, select `US-005`, enter the approved healthcare URL, and **only the Lab access code** in the form. Generate and review 4–8 cases. Do not copy your Gemini API key into a browser form, this chat, or the repository.
6. Verify a real provider response and only then say the LLM feature is operational. Start with one free-tier demo and check remaining daily requests in Google AI Studio.

The repo's end-to-end Lab HTTP test deliberately **mocks** the model response and the healthcare API. It verifies URL/story intake, structured case validation, signed generation receipts, human approval and source-reviewed GET execution. It proves the integration logic—not live paid model usage or full patient-booking execution.


## Genuine LLM generation with a zero-payment setup

The Lab now defaults to **Google Gemini**, using `gemini-3.5-flash-lite` on Google's **free API tier** when available to the selected project. This is a real LLM service, **not** a rule-based template generator. Google provides a free tier with strict capacity/rate limits; requests to a paid project might be billable. Create and use an **unbilled free-tier Google AI Studio project** and do not enable billing.

- Google AI Studio API keys: https://aistudio.google.com/api-keys
- Google billing tiers: https://ai.google.dev/gemini-api/docs/billing
- Gemini API pricing/free tier: https://ai.google.dev/gemini-api/docs/pricing

The earlier OpenAI key is **not used in the default Gemini mode**, even if still present in Render. Switching to OpenAI requires an explicit `AI_PROVIDER=openai`, which may incur API charges. No automatic paid fallback occurs when Gemini reaches its free-tier quota.

**Privacy:** Google states that free-tier API input and output may be used to improve its products. TestPilot only sends the synthetic user story, code-reviewed route/acceptance criteria and aggregated public doctor specialties; never real patients, credentials, appointments, phone numbers, or uploaded documents. LLM cases remain NOT_RUN until reviewed; only bound audited read-only GET probes may run on public healthcare.

**Status boundary:** automated tests use mocked Gemini responses; a live key and successful real model response are still required to claim that free-tier AI generation was demonstrated.


## Figma dashboard refinement

**Editable design:** https://www.figma.com/design/7CInSkKoEzd0gTjxd1iPS4

The TestPilot Lab frontend adopts a Figma-inspired dashboard with a responsive header, a five-step workflow, story and use-case context, clearer Gemini readiness, and evidence-first labels around case suggestions and measured API/CI results. Changes are presentational only: no Gemini prompts, API allowlists, review receipts, runner permissions or clinical booking behavior were changed.

- The metric 25 comes from the public Lab user-story catalog; 15 is the documented use-case count.
- The 7 healthcare browser tests metric describes authored healthcare scenarios (plus 4 separate Lab UI checks in the same CI suite), not a dynamic PASS claim.
- AI candidates this session updates when a successful Gemini generation returns in this browser.
- The topbar readiness badge exposes only safe provider availability, never secret values.
- Only actual measured CI reports and approved read-only checks can show PASS/FAIL evidence.
- Separate Chromium smoke tests cover the Figma-inspired dashboard and mobile viewport on a local, uncredentialed Lab server.

**Live implementation:** https://testpilot-lab.onrender.com/


## Later milestone: reviewer-controlled browser evidence and AI/manual comparison

- Source-grounded mapping: `GET /api/traceability` lists each of the 25 stories, its manual cases, available public read-only probes, and approved prewritten Playwright checks. A mapping is **not** a PASS claim.
- After **genuine Gemini generation**, press **Compare with manual test cases** to compare the HMAC-receipted candidate metadata (counts, types, priority and duplicate titles) with the 36-case manual baseline, filtered by the selected story's use case. This is **not** semantic correctness grading.
- After reviewing and ticking at least one model case, press **Show safe browser checks for approved cases**. This returns only fixed, audited story-to-Playwright check mappings. The user can manually open [Reviewed story Playwright check](https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/reviewed-playwright.yml), use the specified `story_id` and `browser_check_id`, and run GitHub Actions in a synthetic isolated Chromium environment. The model never injects a test script.
- The Lab's **Load verified CI reports** now expands the underlying measured test IDs and statuses from the healthcare backend's report API; stack traces and other private logs are not forwarded.
- Full automatic execution of arbitrary generated healthcare scripts is **not implemented**. For stateful booking/admin actions, use reviewed code and disposable synthetic test data in a separate CI/staging backend.

See [Problem Statement Audit](../docs/PROBLEM_STATEMENT_COMPLETION_AUDIT.md) for requirement-by-requirement readiness and remaining evaluation tasks.
