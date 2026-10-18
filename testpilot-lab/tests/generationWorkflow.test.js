"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { handle, FRONTEND, BACKEND } = require("../server");
const stories = require("../user-stories.json");
const { CHECKS } = require("../verifiedChecks");

// Entirely mocked healthcare & model calls. No production writes, no real API credentials.
test("full Lab HTTP workflow validates model candidates, approval and safe GET execution", async () => {
  const realFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalCode = process.env.LAB_ACCESS_CODE;
  process.env.OPENAI_API_KEY = "mock-key-only-not-valid";
  process.env.LAB_ACCESS_CODE = "synthetic-lab-code-for-unit-tests";
  const outbound = [];
  const knownCheck = CHECKS.find(item => item.id === "approved-doctor-list");
  assert.ok(knownCheck);

  const generated = Array.from({ length: 4 }, (_, n) => ({
    id: "AI-" + String(n + 1).padStart(3, "0"),
    title: n === 0 ? "List approved public doctors" : "Requires isolated fixture " + n,
    type: n === 0 ? "positive" : "negative",
    priority: n === 0 ? "P0" : "P1",
    preconditions: "Synthetic doctor catalog fixture",
    steps: ["Load known endpoint", "Compare reviewed expectation"],
    testData: "Fake and public metadata only",
    expectedResult: n === 0 ? "Model cannot invent a success rule" : "Use staging for this scenario",
    probeId: n === 0 ? knownCheck.id : "NONE",
  }));

  global.fetch = async (url, options = {}) => {
    const target = String(url);
    outbound.push({ url: target, method: options.method || "GET" });
    if (target === FRONTEND + "/") {
      return new Response("<!doctype html><title>TestPilot Healthcare</title><div id=\"root\"></div>", {
        status: 200, headers: { "content-type": "text/html" }
      });
    }
    if (target === BACKEND + "/api/v1/doctor/all") {
      return new Response(JSON.stringify({
        success: true,
        doctors: [{ _id: "507f1f77bcf86cd799439011", specialization: "Cardiology" }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (target === "https://api.openai.com/v1/responses") {
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer mock-key-only-not-valid");
      const requestBody = JSON.parse(options.body);
      assert.equal(requestBody.store, false);
      assert.match(requestBody.input, /US-005|approved doctors/i);
      assert.ok(!requestBody.input.includes("synthetic-lab-code-for-unit-tests"));
      return new Response(JSON.stringify({
        output: [{ content: [{ type: "output_text", text: JSON.stringify({ cases: generated }) }] }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw Error("Unapproved mock target: " + target);
  };

  const server = http.createServer((req, res) => handle(req, res));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const local = "http://127.0.0.1:" + server.address().port;
  const send = async (path, body) => {
    const response = await realFetch(local + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: response.status, body: await response.json() };
  };

  try {
    const capabilities = await send("/api/capabilities");
    assert.equal(capabilities.status, 200);
    assert.equal(capabilities.body.aiGenerationReady, true);
    assert.equal(capabilities.body.storyCount, 25);
    assert.equal(capabilities.body.executionMode, "AUDITED_READ_ONLY_GET_PROBES_ONLY");
    assert.equal(JSON.stringify(capabilities.body).includes("mock-key-only"), false);

    const story = stories.find(item => item.id === "US-005");
    assert.ok(story);
    const payload = {
      targetUrl: FRONTEND + "/",
      storyId: story.id,
      storyText: story.story,
      accessCode: "synthetic-lab-code-for-unit-tests"
    };

    const wrongCode = await send("/api/generate", { ...payload, accessCode: "not-the-code" });
    assert.equal(wrongCode.status, 401);
    assert.equal(outbound.length, 0);

    const generatedResponse = await send("/api/generate", payload);
    assert.equal(generatedResponse.status, 200);
    const result = generatedResponse.body;
    assert.equal(result.success, true);
    assert.equal(result.generatedBy, "OpenAI");
    assert.equal(result.cases.length, 4);
    assert.ok(result.cases.every(item => item.executionStatus === "NOT_RUN" &&
      item.reviewed === false && !("status" in item)));
    assert.equal(result.cases[0].expectedResult, knownCheck.expected);
    assert.ok(typeof result.receipt === "string" && result.receipt.length > 100);

    const completed = await send("/api/execute-generated", {
      storyId: story.id,
      targetUrl: FRONTEND + "/",
      cases: result.cases,
      selectedIds: ["AI-001", "AI-002"],
      receipt: result.receipt,
      accessCode: payload.accessCode
    });
    assert.equal(completed.status, 200);
    assert.deepEqual(completed.body.run.summary, {
      total: 2, passed: 1, failed: 0, skipped: 1,
      durationMs: completed.body.run.summary.durationMs
    });
    assert.equal(completed.body.run.results[0].probeId, knownCheck.id);
    assert.equal(completed.body.run.results[0].status, "PASS");
    assert.equal(completed.body.run.results[0].scope, "AI_CASE_BOUND_TO_VERIFIED_READ_ONLY_PROBE");
    assert.equal(completed.body.run.results[1].status, "SKIPPED");

    const altered = result.cases.map(item => ({ ...item }));
    altered[0].expectedResult = "Always claim PASS";
    const tamper = await send("/api/execute-generated", {
      storyId: story.id,
      targetUrl: FRONTEND + "/",
      cases: altered,
      selectedIds: ["AI-001"],
      receipt: result.receipt,
      accessCode: payload.accessCode
    });
    assert.equal(tamper.status, 400);
    assert.match(tamper.body.message, /changed|receipt|expired/i);

    assert.equal(outbound.filter(item => item.url.startsWith(BACKEND)).length, 3);
    assert.equal(outbound.filter(item => item.url === "https://api.openai.com/v1/responses").length, 1);
    assert.ok(outbound.filter(item => item.url.startsWith(BACKEND)).every(item => item.method === "GET"));
    assert.ok(outbound.every(item => !item.url.includes("/appointment/book")));
  } finally {
    global.fetch = realFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalCode === undefined) delete process.env.LAB_ACCESS_CODE;
    else process.env.LAB_ACCESS_CODE = originalCode;
    await new Promise(resolve => server.close(resolve));
  }
});

test("readiness flags absent private configuration without exposing settings", async () => {
  const prevKey = process.env.OPENAI_API_KEY;
  const prevCode = process.env.LAB_ACCESS_CODE;
  delete process.env.OPENAI_API_KEY;
  delete process.env.LAB_ACCESS_CODE;
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch("http://127.0.0.1:" + server.address().port + "/api/capabilities");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.aiGenerationReady, false);
    assert.equal("OPENAI_API_KEY" in body, false);
    assert.equal("LAB_ACCESS_CODE" in body, false);
  } finally {
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = prevKey;
    if (prevCode === undefined) delete process.env.LAB_ACCESS_CODE; else process.env.LAB_ACCESS_CODE = prevCode;
    await new Promise(resolve => server.close(resolve));
  }
});
