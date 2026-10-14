#!/usr/bin/env node
// Publish measured Jest/Vitest JSON results, never synthetic success claims.
// Usage: node scripts/publishTestReport.js ./test-results.json [suite-name]
const fs = require("node:fs/promises");
const crypto = require("node:crypto");

function toTestPilotReport(results, suite) {
  const tests = (results.testResults || []).flatMap(file =>
    (file.assertionResults || []).map(assertion => ({
      ...assertion,
      fileName: file.name || suite
    }))
  );
  const completed = tests.filter(t => ["passed", "failed"].includes(t.status));
  const skipped = tests.filter(t => !["passed", "failed"].includes(t.status)).length;
  let sequence = 0;
  const seen = new Set();
  const testResults = completed.map(test => {
    const title = (test.fullName || test.title || "Unnamed test").slice(0, 250);
    const match = title.match(/\bTP-\d{3,5}\b|\bTC-\d{3,5}\b/);
    let id = match ? match[0] : "";
    if (!id || seen.has(id)) {
      do { id = "TC-" + String(++sequence).padStart(5, "0"); } while (seen.has(id));
    }
    seen.add(id);
    const status = test.status === "passed" ? "PASS" : "FAIL";
    return {
      id, title,
      category: /unauthoriz|token|permission|security|forbid/i.test(title) ? "Security"
        : /concurr|race|invalid|blocked|reject|duplicate|outside/i.test(title) ? "Edge Case"
        : "Happy Path",
      status,
      executionTime: Number.isFinite(test.duration) && test.duration >= 0 ? Math.floor(test.duration) : 0,
      errorLog: status === "FAIL"
        ? (test.failureMessages || []).join("\n").slice(0, 1000) : null
    };
  });
  const passed = testResults.filter(t => t.status === "PASS").length;
  const failed = testResults.length - passed;
  return {
    runId: ((process.env.GITHUB_RUN_ID || crypto.randomUUID()) + ":" +
      (process.env.GITHUB_RUN_ATTEMPT || "1") + ":" + suite).replace(/[^a-zA-Z0-9_:-]/g, "-").slice(0, 128),
    timestamp: new Date().toISOString(),
    suite,
    engine: process.env.TESTPILOT_REPORT_ENGINE === "LLM-Generated" ? "LLM-Generated" : "Static-CI",
    summary: {
      total: passed + failed + skipped,
      passed, failed, skipped,
      durationMs: Number.isFinite(results.startTime) ? Math.max(0, Date.now() - results.startTime)
        : tests.reduce((sum, t) => sum + (Number.isFinite(t.duration) ? t.duration : 0), 0)
    },
    testResults
  };
}

async function publish() {
  const file = process.argv[2];
  const suite = process.argv[3] || "TestPilot-CI";
  if (!file) throw new Error("Provide a Jest/Vitest JSON results file.");
  const results = JSON.parse(await fs.readFile(file, "utf8"));
  const report = toTestPilotReport(results, suite);
  if (report.summary.total === 0 || Number(results.numFailedTestSuites || 0) > 0 && report.summary.failed === 0) {
    throw new Error("Runner output has no usable test outcomes or contains an unreported suite failure.");
  }
  // No credentials means no reporting. CI can still test without production connectivity.
  if (!process.env.TESTPILOT_REPORT_API_URL || !process.env.REPORT_INGEST_TOKEN) {
    console.log("Report publishing disabled: set TESTPILOT_REPORT_API_URL and REPORT_INGEST_TOKEN.");
    return;
  }
  const url = new URL(process.env.TESTPILOT_REPORT_API_URL);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Report API URL must use HTTPS outside localhost.");
  }
  const response = await fetch(new URL("/api/reports/test-run", url), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-TestPilot-Report-Token": process.env.REPORT_INGEST_TOKEN },
    body: JSON.stringify(report),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("Report ingestion returned HTTP " + response.status);
  console.log("Published " + report.summary.total + " measured test results.");
}

if (require.main === module) {
  publish().catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { toTestPilotReport };
