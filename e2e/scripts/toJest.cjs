"use strict";
// Translate measured Playwright JSON into the shape expected by TestPilot's
// authenticated CI publisher. Never assume PASS when an assertion did not run.
const fs = require("node:fs");

function gather(suites, out = []) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) out.push(spec);
    gather(suite.suites || [], out);
  }
  return out;
}

function toJest(playwright) {
  if (!playwright || !Array.isArray(playwright.suites)) {
    throw new Error("Expected a Playwright JSON report containing suites.");
  }
  const assertions = [];
  for (const spec of gather(playwright.suites)) {
    for (const execution of spec.tests || []) {
      const last = (execution.results || []).at(-1);
      let status;
      if (execution.status === "skipped" || last?.status === "skipped") {
        status = "pending";
      } else if (last?.status === "passed" &&
          ["expected", "flaky"].includes(execution.status)) {
        status = "passed";
      } else {
        status = "failed";
      }
      const duration = (execution.results || []).reduce((n, result) =>
        n + (Number.isFinite(result.duration) && result.duration > 0 ? result.duration : 0), 0);
      assertions.push({
        title: spec.title,
        fullName: spec.title,
        status,
        duration: Math.floor(duration),
        failureMessages: status === "failed"
          ? [String(last?.error?.message || "Browser test did not complete successfully.").slice(0, 900)]
          : []
      });
    }
  }
  if (assertions.length === 0) throw new Error("No actual Playwright tests are present.");
  return {
    startTime: Date.now() - assertions.reduce((sum, item) => sum + item.duration, 0),
    numFailedTestSuites: assertions.some(item => item.status === "failed") ? 1 : 0,
    testResults: [{ name: "Playwright Chromium browser tests", assertionResults: assertions }]
  };
}

if (require.main === module) {
  const [, , from, to] = process.argv;
  if (!from || !to) {
    console.error("Usage: node toJest.cjs results.json converted.json");
    process.exitCode = 2;
  } else {
    try {
      const output = toJest(JSON.parse(fs.readFileSync(from, "utf8")));
      fs.writeFileSync(to, JSON.stringify(output));
      console.log("Prepared " + output.testResults[0].assertionResults.length +
        " measured Playwright results for TestPilot reporting.");
    } catch (error) {
      console.error("Unable to convert browser results: " + error.message);
      process.exitCode = 1;
    }
  }
}
module.exports = { toJest };
