"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { CHECKS, FRONTEND, BACKEND, checksForStory, executeStoryChecks } =
  require("../verifiedChecks");

function createReply(status, content) {
  return {
    status, ok: status >= 200 && status < 300,
    text: async () => typeof content === "string" ? content : JSON.stringify(content),
    json: async () => content
  };
}

test("every execution probe is a fixed read-only check mapped to a documented story", () => {
  const stories = require("../user-stories.json");
  assert.equal(new Set(CHECKS.map(c => c.id)).size, CHECKS.length);
  for (const probe of CHECKS) {
    assert.ok(probe.expected.length > 10);
    for (const storyId of probe.stories) {
      assert.ok(stories.some(s => s.id === storyId));
      assert.ok(checksForStory(storyId).some(s => s.id === probe.id && s.method === "GET"));
    }
  }
});

test("approved doctor listing runs a real schema assertion and reports measured result", async () => {
  const seen = [];
  const run = await executeStoryChecks("US-005", { fetchImpl: async (url, options) => {
    seen.push({ url, options });
    return createReply(200, { success: true, doctors: [{ specialization: "Cardiology" }] });
  } });
  assert.deepEqual(run.summary, {
    total: 1, passed: 1, failed: 0, skipped: 0, durationMs: run.summary.durationMs
  });
  assert.equal(run.generatedTestsExecuted, false);
  assert.equal(run.results[0].scope, "VERIFIED_READ_ONLY_PROBE");
  assert.ok(seen.every(x => x.url.startsWith(BACKEND) && x.options.method === "GET" && x.options.redirect === "error"));
});

test("read-only check returns FAIL when the HTTP contract is not met", async () => {
  const run = await executeStoryChecks("US-003", {
    fetchImpl: async () => createReply(200, { user: "never dump private data into report" })
  });
  assert.equal(run.results[0].status, "FAIL");
  assert.equal(run.summary.failed, 1);
  assert.doesNotMatch(JSON.stringify(run), /never dump private data into report/);
});

test("sensitive mutation stories SKIP rather than submitting live POST/PUT", async () => {
  let called = false;
  const run = await executeStoryChecks("US-017", {
    fetchImpl: async () => { called = true; throw Error("Should never call live booking API"); }
  });
  assert.equal(called, false);
  assert.equal(run.summary.skipped, 1);
  assert.equal(run.results[0].status, "SKIPPED");
  assert.match(run.results[0].actual, /no live write performed/);
});

test("doctor-details probe uses only a publicly listed doctor", async () => {
  const paths = [];
  const run = await executeStoryChecks("US-006", { fetchImpl: async (url, opts) => {
    paths.push([url, opts.method]);
    if (url.endsWith("/doctor/all")) return createReply(200, {
      success: true, doctors: [{ _id: "0123456789abcdef01234567" }]
    });
    if (url.endsWith("/doctor/0123456789abcdef01234567")) return createReply(200, {
      success: true, doctor: { _id: "0123456789abcdef01234567" }
    });
    throw Error("Unexpected request");
  } });
  assert.equal(run.summary.passed, 1);
  assert.equal(paths.length, 2);
  assert.ok(paths.every(x => x[1] === "GET"));
});

test("public slots checks use a future approved fixture but never book it", async () => {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const seen = [];
  const run = await executeStoryChecks("US-007", { fetchImpl: async (url, opts) => {
    seen.push([url, opts.method]);
    if (url.endsWith("/doctor/all")) return createReply(200, {
      success: true,
      doctors: [{ _id: "0123456789abcdef01234567",
        weeklyAvailability: days.map(day => ({
          day, enabled: true, sessions: [{ start: "09:00", end: "17:00" }]
        }))
      }]
    });
    if (url.startsWith(BACKEND + "/api/v1/doctor/available-slots?")) return createReply(200, {
      success: true, availableSlots: ["10:00"], noPatientInfo: true
    });
    throw Error("Unexpected request");
  } });
  assert.equal(run.summary.passed, 1);
  assert.equal(seen.length, 2);
  assert.ok(seen.every(x => x[1] === "GET"));
});

test("no approved fixture means SKIPPED, never a fabricated success", async () => {
  const run = await executeStoryChecks("US-007", { fetchImpl: async () =>
    createReply(200, { success: true, doctors: [] }) });
  assert.equal(run.summary.skipped, 1);
  assert.equal(run.summary.passed, 0);
});

test("healthcare homepage gets checked separately from the backend", async () => {
  const run = await executeStoryChecks("US-004", { fetchImpl: async (url, options) => {
    assert.equal(url, FRONTEND + "/");
    assert.equal(options.method, "GET");
    return createReply(200, '<html><body><div id="root"></div></body></html>');
  } });
  assert.equal(run.summary.passed, 1);
});
