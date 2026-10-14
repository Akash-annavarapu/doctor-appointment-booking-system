# TestPilot — Runtime AI Engine and Verified Analytics

## New backend APIs
- POST /api/ai/generate-tests: administrator JWT required. Accepts framework (jest/vitest), suiteType (unit/integration/e2e), target (method/path), and at least one of useCase, apiContract or uiSchema. Optional edgeCases is an array. Calls the OpenAI Responses API and returns a reviewed:false, executionStatus:NOT_RUN candidate with JavaScript test source and assertionMap, not an executed test.
- POST /api/reports/test-run: requires X-TestPilot-Report-Token. Validates and saves real JSON results into MongoDB, rejects invalid count totals, emits a sanitized SSE event.
- GET /api/reports/recent and GET /api/reports/stream: public sanitized metrics, no raw logs. Both are also mounted under /api/v1/reports for the React client.

The existing Express backend is CommonJS: server/services/aiTestGenerator.js is the executable implementation; server/services/aiTestGenerator.ts provides the requested TypeScript interface for typed consumers.

## Required deployment configuration
1. Set OPENAI_API_KEY and optionally OPENAI_TEST_MODEL=gpt-4.1-mini on the Render backend. Neither value belongs in frontend environment variables.
2. Generate a random REPORT_INGEST_TOKEN at least 24 characters long, set it on the Render backend and as a GitHub Actions repository secret of the same name.
3. Set the GitHub Actions repository variable TESTPILOT_REPORT_API_URL to the real backend origin (https://your-backend.onrender.com, not frontend).
4. Trigger GitHub Actions. It serializes measured Jest and Vitest JSON output, and sends it via the signed ingestion API. If publishing is not configured, the workflow skips publishing; it never produces pretend PASS results.

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
- No API key or report token has been configured by this commit. Without them, generating tests and publishing analytics are disabled, as intended.
- Generated tests may be syntactically valid but behaviorally wrong until human reviewed and executed. Test code is not evidence of PASS.
- Only use engine LLM-Generated for actual approved AI suites measured by CI; default is Static-CI. Public analytics intentionally omit errorLog.
