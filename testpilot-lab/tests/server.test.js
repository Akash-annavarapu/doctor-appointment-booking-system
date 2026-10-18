"use strict";
const test = require("node:test");
// Legacy OpenAI tests explicitly select the optional paid provider.
process.env.AI_PROVIDER = "openai";
const assert = require("node:assert/strict");
const http = require("node:http");
const {
  checkTarget, getStory, inspectSut, validateGenerated, checkAccessCode,
  generateCases, handle, FRONTEND, BACKEND
} = require("../server");

function sampleCases() {
  return Array.from({ length: 4 }, (_, index) => ({
    id: "AI-" + String(index + 1).padStart(3, "0"),
    title: "Synthetic scenario " + (index + 1),
    type: ["positive", "negative", "boundary", "security"][index],
    priority: "P1",
    preconditions: "A synthetic account and approved doctor exist.",
    steps: ["Provide synthetic input", "Observe the response"],
    testData: "Synthetic record",
    expectedResult: "The verified contract is respected"
  }));
}
function fakeRemoteFetch(url) {
  if (url.startsWith(FRONTEND)) return Promise.resolve({
    ok: true, text: async () => '<html><head><title>Healthcare Appointment</title></head><body><div id="root"></div></body></html>'
  });
  if (url === BACKEND + "/api/v1/doctor/all") return Promise.resolve({
    ok: true, text: async () => JSON.stringify({
      success: true, doctors: [{
        specialization: "Cardiology", patientName: "MUST NEVER LEAK", phone: "9999999999"
      }]
    })
  });
  throw new Error("Unexpected inspection URL " + url);
}

test("only known healthcare frontend URL is allowed", () => {
  assert.equal(checkTarget(FRONTEND + "/"), FRONTEND + "/");
  assert.equal(checkTarget(FRONTEND + "/test-cases"), FRONTEND + "/test-cases");
  for (const url of [
    "http://doctor-appointment-frontend-9dbs.onrender.com/",
    "https://evil.example/",
    "https://127.0.0.1/",
    "https://doctor-appointment-frontend-9dbs.onrender.com.evil.com/",
    FRONTEND + "/api/v1/auth/me",
    FRONTEND + "/?url=https://evil.example",
    "file:///etc/passwd",
    "javascript:alert(1)"
  ]) assert.throws(() => checkTarget(url));
});

test("catalog contains exactly 25 unique role-based stories across all 15 use cases", () => {
  const data = require("../user-stories.json");
  assert.equal(data.length, 25);
  assert.equal(new Set(data.map(s => s.id)).size, 25);
  assert.equal(new Set(data.map(s => s.useCase)).size, 15);
  for (const item of data) {
    assert.match(item.story, /^As a[n]? /);
    assert.match(item.story, /I want/);
    assert.equal(typeof item.target.method, "string");
    assert.ok(item.acceptanceCriteria.length >= 1);
  }
});

test("story can be edited but must belong to a known code-grounded story", () => {
  const output = getStory({ storyId: "US-017", storyText: "As a patient, I want a valid appointment booking." });
  assert.equal(output.id, "US-017");
  assert.equal(output.target.path, "/api/v1/appointment/book");
  assert.throws(() => getStory({ storyId: "US-999", storyText: "Synthetic test story with enough characters" }));
  assert.throws(() => getStory({ storyId: "US-017", storyText: "too short" }));
});

test("public inspection gets trusted URLs only and summarizes approved doctors", async () => {
  const calls = [];
  const result = await inspectSut(FRONTEND + "/", async url => {
    calls.push(url);
    return fakeRemoteFetch(url);
  });
  assert.deepEqual(calls, [FRONTEND + "/", BACKEND + "/api/v1/doctor/all"]);
  assert.equal(result.page.reactRootDetected, true);
  assert.equal(result.publicDoctorCatalog.approvedCount, 1);
  assert.deepEqual(result.publicDoctorCatalog.specialties, ["Cardiology"]);
  assert.doesNotMatch(JSON.stringify(result), /MUST NEVER LEAK|9999999999/);
});

test("generated cases cannot claim executable PASS and duplicate IDs fail", () => {
  const cases = validateGenerated({ cases: sampleCases().map(c => ({ ...c, status: "PASS" })) });
  assert.equal(cases.length, 4);
  assert.ok(cases.every(c => c.executionStatus === "NOT_RUN" && c.reviewed === false && !("status" in c)));
  const duplicates = sampleCases();
  duplicates[2].id = duplicates[0].id;
  assert.throws(() => validateGenerated({ cases: duplicates }));
});

test("an access code is required before generation", () => {
  assert.doesNotThrow(() => checkAccessCode("long-synthetic-access-code", "long-synthetic-access-code"));
  assert.throws(() => checkAccessCode("invalid", "long-synthetic-access-code"));
  assert.throws(() => checkAccessCode("anything", ""));
});

test("model response uses verified story and returns never-executed cases", async () => {
  const before = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "synthetic-key-not-real";
  try {
    const story = getStory({
      storyId: "US-017", storyText: "As a patient, I want to book a free doctor slot."
    });
    let captured;
    const cases = await generateCases({
      story,
      inspection: { page: { title: "Healthcare Appointment" }, publicDoctorCatalog: { approvedCount: 1 } },
      fetchImpl: async (url, options) => {
        captured = { url, options };
        return {
          ok: true,
          json: async () => ({ output: [{ content: [{ type: "output_text",
            text: JSON.stringify({ cases: sampleCases() })
          }] }] })
        };
      }
    });
    assert.equal(captured.url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(captured.options.body);
    assert.equal(body.store, false);
    assert.match(body.input, /US-017|appointment\/book/);
    assert.ok(cases.every(c => c.executionStatus === "NOT_RUN"));
  } finally {
    if (before === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = before;
  }
});

test("the separate lab serves its own health and documented story catalog", async () => {
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = server.address().port;
    const health = await fetch("http://127.0.0.1:" + port + "/healthz").then(x => x.json());
    assert.deepEqual(health, { ok: true, service: "testpilot-lab" });
    const catalog = await fetch("http://127.0.0.1:" + port + "/api/stories").then(x => x.json());
    assert.equal(catalog.count, 25);
  } finally { await new Promise(resolve => server.close(resolve)); }
});


test("provider 429 error codes distinguish credits, spend limits and request rate without leaking details", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "mock-secret-key-not-real";
  const story = getStory({ storyId: "US-005", storyText:
    "As a visitor, I want to browse approved doctors." });
  const inspection = { page: { title: "Healthcare Demo" }, publicDoctorCatalog: { approvedCount: 1 } };
  const makeReply = (error, status = 429) => new Response(JSON.stringify({ error: {
    ...error, message: "DO NOT DISPLAY PROVIDER ERROR CONTENT mock-secret-key-not-real"
  } }), { status, headers: { "content-type": "application/json" } });
  try {
    const examples = [
      [{ code: "credit_balance_exhausted", type: "insufficient_quota" }, /API credits are exhausted/],
      [{ code: "project_spend_limit_exceeded" }, /spending limit reached/],
      [{ code: "organization_spend_limit_exceeded" }, /spending limit reached/],
      [{ code: "organization_usage_limit_exceeded" }, /organization usage limit reached/],
      [{ type: "insufficient_quota" }, /quota or billing limit reached/],
      [{ code: "rate_limit_exceeded" }, /rate limit reached/],
      [{ code: "unrecognized_error" }, /HTTP 429.*Check API credits/]
    ];
    for (const [providerError, expectedMessage] of examples) {
      await assert.rejects(
        generateCases({ story, inspection, fetchImpl: async () => makeReply(providerError) }),
        err => {
          assert.equal(err.status, 502);
          assert.match(err.message, expectedMessage);
          assert.doesNotMatch(err.message, /DO NOT DISPLAY|mock-secret-key/);
          return true;
        }
      );
    }
    await assert.rejects(generateCases({ story, inspection,
      fetchImpl: async () => makeReply({ code: "invalid_api_key" }, 401)
    }), /rejected the API credentials or permissions/);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
