"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { handle, BACKEND } = require("../server");

test("Lab exposes individually measured CI assertions, never raw logs or fabricated AI PASS", async () => {
  const original = global.fetch;
  const realFetch = original;
  const run = {
    runId: "test-ci:001",
    timestamp: "2026-10-24T00:00:00.000Z",
    suite: "playwright-chromium",
    engine: "Static-CI",
    summary: { total: 2, passed: 1, failed: 1, skipped: 0, durationMs: 171 },
    testResults: [
      { id:"TC-0502", title:"TC-0502 specialty filter", status:"PASS",
        executionTime:82, errorLog:"secret should not escape" },
      { id:"TC-0504", title:"TC-0504 slot preview", status:"FAIL",
        executionTime:89, errorLog:"patient private details should not escape" },
      { id:"AI-001", title:"Unverified arbitrary candidate", status:"PASS",
        executionTime:1, errorLog:null }
    ]
  };
  global.fetch = async url => {
    assert.equal(String(url), BACKEND + "/api/reports/recent?limit=6");
    return new Response(JSON.stringify({ success:true, runs: [
      run,
      { ...run, runId:"fake-ai", engine:"LLM-Generated" }
    ] }), { status:200, headers:{ "content-type":"application/json" } });
  };
  const server = http.createServer((req,res)=>handle(req,res));
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {
    const response=await realFetch("http://127.0.0.1:"+server.address().port+"/api/ci-results");
    assert.equal(response.status,200);
    const payload=await response.json();
    assert.equal(payload.runs.length,1);
    assert.equal(payload.runs[0].engine,"Static-CI");
    assert.deepEqual(payload.runs[0].testResults.map(item=>item.id),["TC-0502","TC-0504"]);
    assert.deepEqual(payload.runs[0].testResults.map(item=>item.status),["PASS","FAIL"]);
    assert.equal(JSON.stringify(payload).includes("patient private details"),false);
    assert.equal(JSON.stringify(payload).includes("secret should not escape"),false);
  } finally {
    global.fetch=original;
    await new Promise(resolve=>server.close(resolve));
  }
});
