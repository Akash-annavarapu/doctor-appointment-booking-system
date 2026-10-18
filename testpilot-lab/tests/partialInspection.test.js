"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { inspectSut, FRONTEND, BACKEND } = require("../server");

test("read-only inspection survives unavailable doctor API without inventing doctor counts", async () => {
  let retries = 0;
  const result = await inspectSut(FRONTEND + "/", async url => {
    if (url === FRONTEND + "/") return new Response(
      '<html><title>Healthcare</title><div id="root"></div></html>', { status: 200 });
    assert.equal(url, BACKEND + "/api/v1/doctor/all");
    retries++;
    return new Response("Bad gateway", { status: 502 });
  });
  assert.equal(retries, 3);
  assert.equal(result.inspectionStatus, "PARTIAL");
  assert.equal(result.page.reactRootDetected, true);
  assert.equal(result.publicDoctorCatalog.available, false);
  assert.equal(result.publicDoctorCatalog.approvedCount, null);
  assert.deepEqual(result.publicDoctorCatalog.specialties, []);
  assert.match(result.evidenceScope, /not verified/i);
});

test("a transient HTTP 502 is retried and complete inspection is labeled FULL", async () => {
  let calls = 0;
  const result = await inspectSut(FRONTEND + "/", async url => {
    if (url === FRONTEND + "/") return new Response(
      '<html><div id="root"></div></html>', { status: 200 });
    calls++;
    if (calls === 1) return new Response("Unavailable", { status: 502 });
    return new Response(JSON.stringify({ success: true, doctors: [
      { specialization: "Cardiology" }
    ] }), { status: 200 });
  });
  assert.equal(calls, 2);
  assert.equal(result.inspectionStatus, "FULL");
  assert.equal(result.publicDoctorCatalog.available, true);
  assert.equal(result.publicDoctorCatalog.approvedCount, 1);
});

test("both unavailable public services never count as verified inspection", async () => {
  await assert.rejects(inspectSut(FRONTEND + "/", async () =>
    new Response("Bad gateway", { status: 502 })),
  /frontend and doctor API could not both be verified/);
});
