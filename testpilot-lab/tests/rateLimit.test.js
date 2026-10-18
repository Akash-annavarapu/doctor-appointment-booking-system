"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { takeRateLimit, handle, FRONTEND } = require("../server");

test("read-only execution does not exhaust AI generation requests", () => {
  const ip = "test-socket-independent";
  const now = 1800000000000;
  for (let i = 0; i < 20; i++) takeRateLimit(ip, "execute", now + i);
  for (let i = 0; i < 12; i++) takeRateLimit(ip, "execute-generated", now + i);
  for (let i = 0; i < 4; i++) takeRateLimit(ip, "generate", now + i);
  assert.throws(() => takeRateLimit(ip, "generate", now + 4), error => {
    assert.equal(error.status, 429);
    assert.match(error.message, /AI generation limit reached.*15 minutes/);
    assert.equal(error.retryAfterSeconds, 900);
    return true;
  });
  assert.throws(() => takeRateLimit(ip, "execute", now + 20),
    error => error.status === 429 && /Read-only test execution/.test(error.message));
  assert.doesNotThrow(() => takeRateLimit(ip, "generate", now + 15 * 60 * 1000));
});

test("throttled HTTP response includes retry delay and Retry-After", async () => {
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    for (let i = 0; i < 20; i++) takeRateLimit("127.0.0.1", "execute", Date.now());
    const response = await fetch("http://127.0.0.1:" + server.address().port + "/api/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storyId: "US-005", targetUrl: FRONTEND + "/" })
    });
    const data = await response.json();
    assert.equal(response.status, 429);
    assert.ok(data.retryAfterSeconds > 0);
    assert.equal(response.headers.get("retry-after"), String(data.retryAfterSeconds));
    assert.match(data.message, /Try again in/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
