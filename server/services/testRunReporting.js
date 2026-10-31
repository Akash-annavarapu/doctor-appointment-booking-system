const { EventEmitter } = require("node:events");

const events = new EventEmitter();
events.setMaxListeners(100);

class ReportError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function safeError(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new ReportError("errorLog must be a string or null.");
  return value.slice(0, 1000)
    .replace(/\bBearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[EMAIL REDACTED]");
}

function safeScreenshot(value, meta) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > 160000 ||
      meta.engine !== "Static-CI" || meta.suite !== "playwright-chromium" ||
      meta.status !== "FAIL" ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new ReportError("Screenshots require a failed, isolated Playwright CI assertion and bounded PNG bytes.");
  }
  let bytes;
  try { bytes = Buffer.from(value, "base64"); }
  catch { throw new ReportError("Invalid PNG screenshot."); }
  const png = Buffer.from([137,80,78,71,13,10,26,10]);
  if (bytes.length < 67 || bytes.length > 120000 ||
      !bytes.subarray(0,8).equals(png) ||
      bytes.toString("base64") !== value) {
    throw new ReportError("Screenshot must be a bounded base64 PNG.");
  }
  return value;
}
const isCount = n => Number.isSafeInteger(n) && n >= 0;
function validateReport(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ReportError("Expected a JSON test run object.");
  }
  const { runId, timestamp, suite, engine, summary, testResults } = input;
  if (typeof runId !== "string" || !/^[\w:-]{5,128}$/.test(runId) ||
      typeof suite !== "string" || suite.length < 1 || suite.length > 150 ||
      !["LLM-Generated", "Static-CI"].includes(engine)) {
    throw new ReportError("Invalid runId, suite or engine.");
  }
  if (typeof timestamp !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(timestamp) ||
      !Number.isFinite(Date.parse(timestamp))) {
    throw new ReportError("timestamp must be an ISO 8601 UTC string.");
  }
  if (!summary || !["total", "passed", "failed", "skipped", "durationMs"]
      .every(k => isCount(summary[k])) ||
      summary.total !== summary.passed + summary.failed + summary.skipped) {
    throw new ReportError("Summary counts must be nonnegative and add up to total.");
  }
  if (!Array.isArray(testResults) || testResults.length > 500 ||
      testResults.length !== summary.passed + summary.failed) {
    throw new ReportError("testResults must match passed + failed (skipped are summary-only).");
  }
  const ids = new Set();
  let passes = 0;
  let capturedScreenshots = 0;
  const results = testResults.map(item => {
    if (!item || typeof item !== "object" ||
        typeof item.id !== "string" || !/^(?:TP|TC)-\d{3,5}$/.test(item.id) ||
        ids.has(item.id) ||
        typeof item.title !== "string" || !item.title.trim() || item.title.length > 250 ||
        !["Edge Case", "Happy Path", "Security"].includes(item.category) ||
        !["PASS", "FAIL"].includes(item.status) ||
        !isCount(item.executionTime)) {
      throw new ReportError("Invalid or duplicate test result.");
    }
    ids.add(item.id);
    if (item.status === "PASS") passes++;
    const screenshotBase64 = safeScreenshot(item.screenshotBase64,
      { engine, suite, status: item.status });
    if (screenshotBase64 && ++capturedScreenshots > 1)
      throw new ReportError("At most one synthetic failure screenshot per published run.");
    return {
      id: item.id, title: item.title.trim(), category: item.category,
      status: item.status, executionTime: item.executionTime,
      errorLog: safeError(item.errorLog), screenshotBase64
    };
  });
  if (passes !== summary.passed) throw new ReportError("Result statuses disagree with summary.");
  return {
    runId, timestamp: new Date(timestamp), suite, engine,
    summary: {
      total: summary.total, passed: summary.passed, failed: summary.failed,
      skipped: summary.skipped, durationMs: summary.durationMs
    },
    testResults: results
  };
}

// This response is publicly displayed: no raw stack traces, tokens or patient-like details.
function publicReport(document) {
  return {
    runId: document.runId,
    timestamp: document.timestamp instanceof Date
      ? document.timestamp.toISOString() : new Date(document.timestamp).toISOString(),
    suite: document.suite,
    engine: document.engine,
    summary: document.summary,
    evidenceRunUrl: /^[0-9]+:[0-9]+:/.test(document.runId)
      ? "https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/" +
        document.runId.split(":")[0] : null,
    testResults: document.testResults.map(({ id, title, category, status,
      executionTime, screenshotBase64 }) => ({
      id, title, category, status, executionTime,
      errorLog: null,
      failureDetail: status === "FAIL"
        ? "Isolated Playwright assertion failed. Inspect uploaded CI report and trace for details."
        : null,
      screenshotDataUrl: status === "FAIL" && screenshotBase64
        ? "data:image/png;base64," + screenshotBase64 : null
    }))
  };
}

module.exports = { events, validateReport, publicReport, ReportError };
