# TestPilot Lab — standalone testing application

**A second application** distinct from the existing deployed healthcare application. Its Node.js server hosts its own UI and API without external NPM dependencies.

## How it fulfills Kavi sir's Step 2

1. Paste the existing healthcare URL https://doctor-appointment-frontend-9dbs.onrender.com/.
2. Select from 25 documented user stories (or edit the story text). Stories contain role, use case, source-code anchor, API path and acceptance criteria.
3. Click Inspect live application to read the public HTML and approved-doctor catalog from the exact approved hosts.
4. When configured with OpenAI, use Generate AI test cases. Model receives the story, route and safe public inspection evidence and returns 4–8 reviewable test cases.
5. Export JSON for review. Every case is marked NOT_RUN; this app does not execute tests.

Only the allowlisted healthcare deployment can be inspected: arbitrary domain crawling and localhost access are blocked to prevent SSRF. Public HTML cannot prove the behavior of authenticated booking screens.

## Local run

Requires Node.js 22 or newer. No dependency installation needed.

    cd testpilot-lab
    npm test
    npm start

Open http://localhost:5050/.

## Independent Render deployment

Create a NEW Render Web Service pointing at this same GitHub repository, without changing the existing healthcare frontend/backend services.

- Root Directory: testpilot-lab
- Runtime: Node.js
- Build command: npm install
- Start command: npm start
- Health check path: /healthz
- Private environment variables: OPENAI_API_KEY and LAB_ACCESS_CODE (minimum 16 random characters); optional OPENAI_TEST_MODEL=gpt-4.1-mini

No API key is stored in this repository or returned to the browser. Lab inspection works without an AI key. AI generation accurately returns HTTP 503 until configured. A private lab access code and basic throttling prevent open-ended anonymous API usage. For wider production rollout, upgrade to managed authentication and persistent rate-limiting.

## Endpoints

- GET /healthz — liveness
- GET /api/stories — 25 source-grounded user stories
- POST /api/inspect — request body: {"targetUrl":"https://doctor-appointment-frontend-9dbs.onrender.com/"}
- POST /api/generate — request body: {"targetUrl":"...","storyId":"US-017","storyText":"As a patient...","accessCode":"..."}

The generated cases include id, title, type, priority, preconditions, steps, testData and expectedResult, always reviewed=false, executionStatus=NOT_RUN.

## Roadmap

- Week 5: user stories, source traceability, progress documentation and separate Lab UI.
- Next: configure live OpenAI key, demonstrate a generated test-case set and review output.
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
