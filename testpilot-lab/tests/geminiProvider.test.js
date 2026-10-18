"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { activeAiConfig, generateCases, handle, FRONTEND, BACKEND } = require("../server");
const stories = require("../user-stories.json");
const { CHECKS } = require("../verifiedChecks");

const sampleCases = () => Array.from({ length: 4 }, (_, i) => ({
  id: "AI-" + String(i + 1).padStart(3, "0"),
  title: i === 0 ? "Verify public approved doctor list" : "Synthetic scenario " + i,
  type: i === 0 ? "positive" : "negative", priority: "P1",
  preconditions: "Approved synthetic doctor fixture",
  steps: ["Use a reviewed public read-only API", "Check its response"],
  testData: "Synthetic doctor details only",
  expectedResult: "Public doctors follow source contract",
  probeId: i === 0 ? "approved-doctor-list" : "NONE"
}));

test("Gemini default ignores the uncredited OpenAI key without silently falling back", () => {
  const old = process.env.AI_PROVIDER;
  const oldOpenAi = process.env.OPENAI_API_KEY;
  try {
    delete process.env.AI_PROVIDER;
    process.env.OPENAI_API_KEY = "unused-paid-provider-key";
    assert.equal(activeAiConfig().provider, "gemini");
    assert.equal(activeAiConfig().key, process.env.GEMINI_API_KEY);
    assert.equal(activeAiConfig().model, "gemini-3.5-flash-lite");
    process.env.AI_PROVIDER = "openai";
    assert.equal(activeAiConfig().provider, "openai");
    assert.equal(activeAiConfig().key, "unused-paid-provider-key");
  } finally {
    if (old === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = old;
    if (oldOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldOpenAi;
  }
});

test("Google Gemini structured LLM JSON is validated and cannot fabricate PASS", async () => {
  const old = [process.env.AI_PROVIDER, process.env.GEMINI_API_KEY];
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "fake-gemini-unit-test-key";
  const story = stories.find(item => item.id === "US-005");
  let called = 0;
  try {
    const output = await generateCases({
      story, inspection: { page: { title: "Healthcare" }, publicDoctorCatalog: { approvedCount: 1 } },
      fetchImpl: async (url, options) => {
        called++;
        assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
        assert.equal(options.headers["x-goog-api-key"], "fake-gemini-unit-test-key");
        assert.equal(options.headers.Authorization, undefined);
        const body = JSON.parse(options.body);
        assert.equal(body.generationConfig.responseMimeType, "application/json");
        assert.deepEqual(body.generationConfig.responseSchema.properties.cases.items.properties.probeId.enum,
          ["NONE", "approved-doctor-list"]);
        assert.match(body.contents[0].parts[0].text, /US-005|approved doctors/i);
        assert.doesNotMatch(options.body, /fake-gemini-unit-test-key/);
        return new Response(JSON.stringify({ candidates: [{
          content: { parts: [{ text: JSON.stringify({ cases: sampleCases() }) }] },
          finishReason: "STOP"
        }] }), { status: 200, headers: { "content-type": "application/json" } });
      }
    });
    assert.equal(called, 1);
    assert.equal(output.length, 4);
    assert.ok(output.every(x => x.executionStatus === "NOT_RUN" && x.reviewed === false));
    assert.equal(output[0].expectedResult,
      CHECKS.find(x => x.id === "approved-doctor-list").expected);
  } finally {
    if (old[0] === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = old[0];
    if (old[1] === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old[1];
  }
});

test("Lab HTTP generation uses only mocked Gemini and preserves signed approval flow", async () => {
  const prior = [process.env.AI_PROVIDER, process.env.GEMINI_API_KEY, process.env.LAB_ACCESS_CODE];
  const savedFetch = global.fetch;
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "mock-gemini-key-private";
  process.env.LAB_ACCESS_CODE = "synthetic-gemini-lab-access-code";
  const outbound = [];
  global.fetch = async (url, options = {}) => {
    const target = String(url);
    outbound.push({ target, method: options.method || "GET" });
    if (target === FRONTEND + "/") return new Response(
      "<html><title>Healthcare</title><div id=\"root\"></div></html>", { status: 200 });
    if (target === BACKEND + "/api/v1/doctor/all") return new Response(
      JSON.stringify({ success: true, doctors: [{ specialization: "Cardiology" }] }),
      { status: 200, headers: { "content-type": "application/json" } });
    if (target === "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent") {
      assert.equal(options.method, "POST");
      assert.equal(options.headers["x-goog-api-key"], "mock-gemini-key-private");
      return new Response(JSON.stringify({ candidates: [{ content: {
        parts: [{ text: JSON.stringify({ cases: sampleCases() }) }]
      } }] }), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw Error("Unexpected outbound mock " + target);
  };
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const send = async (path, data) => {
    const response = await savedFetch(base + path, {
      method: data ? "POST" : "GET",
      headers: data ? { "content-type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined
    });
    return { status: response.status, data: await response.json() };
  };
  try {
    const health = await send("/api/capabilities");
    assert.equal(health.status, 200);
    assert.equal(health.data.aiProvider, "Google Gemini");
    assert.equal(health.data.aiGenerationReady, true);
    assert.equal(JSON.stringify(health.data).includes("mock-gemini-key-private"), false);
    const story = stories.find(s => s.id === "US-005");
    const generated = await send("/api/generate", {
      storyId: "US-005", storyText: story.story, targetUrl: FRONTEND + "/",
      accessCode: "synthetic-gemini-lab-access-code"
    });
    assert.equal(generated.status, 200);
    assert.equal(generated.data.generatedBy, "Google Gemini");
    assert.equal(generated.data.cases.length, 4);
    assert.equal(typeof generated.data.receipt, "string");
    assert.ok(generated.data.cases.every(c => c.executionStatus === "NOT_RUN"));
    assert.deepEqual(outbound.map(c => c.method), ["GET", "GET", "POST"]);
    assert.ok(outbound.every(c => !c.target.includes("openai.com")));
  } finally {
    global.fetch = savedFetch;
    for (const [i, name] of ["AI_PROVIDER", "GEMINI_API_KEY", "LAB_ACCESS_CODE"].entries()) {
      if (prior[i] === undefined) delete process.env[name];
      else process.env[name] = prior[i];
    }
    await new Promise(resolve => server.close(resolve));
  }
});

test("Gemini free-tier rate limits are explained without exposing Google error details", async () => {
  const old = [process.env.AI_PROVIDER, process.env.GEMINI_API_KEY];
  process.env.AI_PROVIDER = "gemini"; process.env.GEMINI_API_KEY = "fake-key";
  const story = stories.find(s => s.id === "US-005");
  try {
    await assert.rejects(generateCases({
      story, inspection: {}, fetchImpl: async () => new Response(JSON.stringify({
        error: { status: "RESOURCE_EXHAUSTED", message: "PRIVATE PROVIDER DIAGNOSTIC" }
      }), { status: 429 })
    }), err => {
      assert.equal(err.status, 502);
      assert.match(err.message, /Gemini free-tier request limit or daily quota reached/);
      assert.doesNotMatch(err.message, /PRIVATE PROVIDER/);
      return true;
    });
  } finally {
    if (old[0] === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = old[0];
    if (old[1] === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = old[1];
  }
});
