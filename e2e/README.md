# TestPilot Week 5 Playwright browser automation

Seven real Chromium browser tests are maintained in `tests/healthcare.browser.spec.cjs`. They run against a locally built healthcare frontend and all API requests are intercepted by the safe synthetic fixture in `fixtures.cjs`. No real patient record, booking or production database is changed.

## Local run

From the repository root with Node.js 22 or newer:

1. `npm ci --prefix client`
2. `npm run build --prefix client`
3. `npm install --prefix e2e`
4. `cd e2e && npx playwright install chromium && npm test`

To view the report from the `e2e` directory, run `npm run test:report`. The HTML and JSON outputs appear in `e2e/artifacts/`. Failures save screenshots and traces to `e2e/test-results/`.

## GitHub Actions and dashboard

`.github/workflows/testpilot-ci.yml` runs the Chromium suite on each push or pull request and uploads the HTML report, JSON report and traces as an artifact. A main-branch push publishes measured results through the existing GitHub OIDC-secured backend reporting service. Results can appear in the existing **Test Cases** and TestPilot Lab **Latest measured CI runs** dashboards.

The conversion adapter is checked separately via `npm run test:unit --prefix e2e`. It maps Playwright's real assertions to TestPilot's reporting schema; any incomplete or unexpected result is treated as failed instead of invented as a pass.

**Scope:** These tests are static browser smoke checks tagged TC-0501–TC-0507. They do **not** claim execution of unreviewed Gemini test cases or full appointment mutation journeys. Add those later only in an isolated staging environment with synthetic patients.

Week 5 report: [docs/WEEK5_PLAYWRIGHT_STATUS.md](../docs/WEEK5_PLAYWRIGHT_STATUS.md).
