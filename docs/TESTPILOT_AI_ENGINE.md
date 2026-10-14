# TestPilot — Runtime AI Engine and Verified Analytics

## New backend APIs
- POST /api/ai/generate-tests: administrator JWT required. Accepts framework (jest/vitest), suiteType (unit/integration/e2e), target (method/path), and at least one of useCase, apiContract or uiSchema. Optional edgeCases is an array. Calls the OpenAI Responses API and returns a reviewed:false, executionStatus:NOT_RUN candidate with JavaScript test source and assertionMap, not an executed test.
- POST /api/reports/test-run: requires X-TestPilot-Report-Token. Validates and saves real JSON results into MongoDB, rejects invalid count totals, emits a sanitized SSE event.
- GET /api/reports/recent and GET /api/reports/stream: public sanitized metrics, no raw logs. Both are also mounted under /api/v1/reports for the React client.

The existing Express backend is CommonJS: server/services/aiTestGenerator.js is the executable implementation; server/services/aiTestGenerator.ts provides the requested TypeScript interface for typed consumers.

## Required deployment configuration
1. On the Render backend choose AI_TEST_PROVIDER=anthropic and set ANTHROPIC_API_KEY (optional ANTHROPIC_TEST_MODEL=claude-sonnet-4-5), OR choose AI_TEST_PROVIDER=openai and set OPENAI_API_KEY. The default provider is Anthropic when an Anthropic key exists, otherwise OpenAI. A consumer Claude subscription is separate from Claude API billing. Never put keys in frontend variables or Git commits.
2. Reporting is now secretless on trusted main-branch GitHub Actions runs via GitHub-signed OIDC identity. The server checks signature, audience, immutable repository ID, workflow reference, ref, event, expiry and matching run ID. No manual REPORT_INGEST_TOKEN is necessary for GitHub Actions. The old token is still supported for manual clients.
3. GitHub CI reports to the known backend URL https://doctor-appointment-booking-system-u1eq.onrender.com by default. Optionally set GitHub Actions variable TESTPILOT_REPORT_API_URL to override the backend origin.
4. Redeploy the Render backend from main, then trigger a main-branch CI run (a push or rerun) and inspect /test-cases. PR runs do not publish. Metrics are shown only from genuinely ingested runner output.

## Sample generation input (JSON)
    {
      "framework": "jest",
      "suiteType": "integration",
      "target": {"method": "POST", "path": "/api/v1/appointment/book"},
      "useCase": {"id": "UC-09", "role": "patient", "expectedStatuses": [201, 400, 401, 409]},
      "apiContract": {"body": ["doctorId", "appointmentDate", "appointmentTime"]},
      "edgeCases": ["double-booking race", "out-of-hours slot", "missing JWT"]
    }

POST this to /api/ai/generate-tests using Authorization: Bearer <admin JWT>.
The provider must return structured JSON containing framework, suiteType, filename, code, and assertionMap entries with id, title, category, expected and actual (always Not executed). All candidates require human review before committing to isolated CI. The backend NEVER executes generated code.

## Sample test report (JSON)
    {
      "runId": "ci:12345:backend",
      "timestamp": "2026-10-14T12:00:00.000Z",
      "suite": "backend-jest",
      "engine": "Static-CI",
      "summary": {"total": 2, "passed": 1, "failed": 0, "skipped": 1, "durationMs": 320},
      "testResults": [{
        "id": "TP-025",
        "title": "Concurrent double booking", "category": "Edge Case",
        "status": "PASS", "executionTime": 320, "errorLog": null
      }]
    }

The total equals passed + failed + skipped; the testResults array includes only PASS/FAIL items. The unchanged 36-case design catalog displays only matched TP IDs as PASS/FAIL after true CI ingestion; other designed cases stay Not run. SSE is per-process; 30-second polling provides a multi-instance fallback.

## Safety and limitations
- Syntax validation plus static scanning are NOT a security sandbox. Never eval, require, or automatically run model-generated code in the live server.
- Run only human-reviewed, committed suites inside disposable isolated CI with synthetic patient data and a dedicated MongoDB database ending in _test; never production databases or PHI.
- The e2e target denotes end-to-end API flows via Jest + Supertest. Browser E2E requires a separate Playwright/Cypress installation and staging data, not present here.
- No provider API key is included in Git. Live LLM generation remains unavailable until the Render backend has a valid provider key. CI reporting uses short-lived GitHub OIDC identity, so it does not require a shared secret or paid API key.
- Generated tests may be syntactically valid but behaviorally wrong until human reviewed and executed. Test code is not evidence of PASS.
- Only use engine LLM-Generated for actual approved AI suites measured by CI; default is Static-CI. Public analytics intentionally omit errorLog.
