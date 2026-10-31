"use strict";
// Translate measured Playwright JSON into the shape expected by TestPilot's
// authenticated CI publisher. Never assume PASS when an assertion did not run.
const fs = require("node:fs");
const path = require("node:path");

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
  let screenshotClaimed = false;
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
      let screenshotBase64 = null;
      if (status === "failed" && !screenshotClaimed) {
        // A trusted local Playwright runner produced this attachment. Permit
        // only output-directory PNG files, max 120 KB, never real patient data.
        for (const attachment of last?.attachments || []) {
          if (!attachment || attachment.contentType !== "image/png" ||
              typeof attachment.path !== "string") continue;
          const candidate = path.resolve(attachment.path);
          const output = path.resolve(__dirname, "../test-results");
          const artifacts = path.resolve(__dirname, "../artifacts");
          if (!(candidate.startsWith(output + path.sep) ||
                candidate.startsWith(artifacts + path.sep))) continue;
          try {
            const bytes = fs.readFileSync(candidate);
            if (bytes.length >= 67 && bytes.length <= 120000 &&
                bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
              screenshotBase64 = bytes.toString("base64");
              screenshotClaimed = true;
              break;
            }
          } catch { /* An optional screenshot may have been cleaned up. */ }
        }
      }
      assertions.push({
        title: spec.title,
        fullName: spec.title,
        status,
        duration: Math.floor(duration),
        failureMessages: status === "failed"
          ? [String(last?.error?.message || "Browser test did not complete successfully.").slice(0, 900)]
          : [],
        screenshotBase64
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
