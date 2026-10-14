const { generateTests, validateMetadata, sanitizeCode, GenerationError } =
  require("../services/aiTestGenerator");
const { validateReport, publicReport } = require("../services/testRunReporting");
const { toTestPilotReport } = require("../scripts/publishTestReport");

const metadata = {
  framework: "jest", suiteType: "integration",
  target: { method: "POST", path: "/api/v1/appointment/book" },
  useCase: { id: "UC-09", expectedStatus: 401 },
  edgeCases: ["Unauthorized booking", "Concurrent double booking"]
};
const code = "test('TC-001: booking requires authorization', () => { expect(401).toBe(401); });";
const candidate = {
  framework: "jest", suiteType: "integration", filename: "booking.test.js",
  code, assertionMap: [{
    id: "TC-001", title: "Authorization", category: "Security",
    expected: "401", actual: "Not executed"
  }]
};
function llmResponse(body) {
  return {
    ok: true,
    json: async () => ({
      output: [{ content: [{ type: "output_text", text: JSON.stringify(body) }] }]
    })
  };
}

describe("TestPilot AI generator contract", () => {
  test("rejects unreviewed metadata without a traceable flow", () => {
    expect(() => validateMetadata({ ...metadata, useCase: null })).toThrow(GenerationError);
  });

  test("creates a syntax-checked, never-executed candidate from the actual LLM response", async () => {
    const fetchImpl = jest.fn(async () => llmResponse({
      ...candidate, code: "~~~irrelevant~~~" // overridden below
    }));
    fetchImpl.mockImplementationOnce(async () => llmResponse({
      ...candidate, code: " " + String.fromCharCode(96).repeat(3) + "js\n" + code +
        "\n" + String.fromCharCode(96).repeat(3)
    }));
    const result = await generateTests(metadata, { fetchImpl, apiKey: "synthetic-test-key" });
    expect(result.code).toBe(code);
    expect(result.reviewed).toBe(false);
    expect(result.executionStatus).toBe("NOT_RUN");
    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(requestBody.store).toBe(false);
    expect(requestBody.input).toContain("/api/v1/appointment/book");
  });

  test("rejects malformed or unsafe generated code", () => {
    expect(() => sanitizeCode("test('bad', () => {")).toThrow(/invalid/);
    expect(() => sanitizeCode("test('TC-001', () => { require('child_process'); expect(true).toBe(true); });"))
      .toThrow(/unsafe/);
  });

  test("rejects LLM output claiming invented pass results", async () => {
    const fake = { ...candidate, assertionMap: [{ ...candidate.assertionMap[0], actual: "PASS" }] };
    await expect(generateTests(metadata, { apiKey: "fake", fetchImpl: async () => llmResponse(fake) }))
      .rejects.toThrow(/not claim/);
  });


  test("reports provider failures without exposing keys", async () => {
    await expect(generateTests(metadata, {
      apiKey: "private-key",
      fetchImpl: async () => ({ ok: false, status: 429 })
    })).rejects.toThrow("LLM provider request failed (429)");
  });
});

const validReport = {
  runId: "ci:12345:backend",
  timestamp: new Date().toISOString(),
  suite: "backend-jest",
  engine: "Static-CI",
  summary: { total: 3, passed: 1, failed: 1, skipped: 1, durationMs: 250 },
  testResults: [
    {
      id: "TP-025", title: "race", category: "Edge Case",
      status: "PASS", executionTime: 12, errorLog: null
    },
    {
      id: "TP-009", title: "expired token", category: "Security",
      status: "FAIL", executionTime: 4, errorLog: "Bearer secret.token.value; test@example.com"
    }
  ]
};

describe("TestPilot report ingestion schema", () => {
  test("enforces real counts and distinct IDs", () => {
    expect(() => validateReport({ ...validReport, summary: { ...validReport.summary, passed: 2 } }))
      .toThrow(/add up/);
    expect(() => validateReport({
      ...validReport,
      testResults: [validReport.testResults[0], validReport.testResults[0]]
    })).toThrow(/duplicate/);
  });

  test("redacts secrets and does not expose logs in public results", () => {
    const report = validateReport(validReport);
    expect(report.testResults[1].errorLog).not.toContain("secret.token");
    const publicView = publicReport(report);
    expect(publicView.testResults[1].errorLog).toBe(null);
  });

  test("converts real Jest output without counting skipped cases as passed", () => {
    const data = toTestPilotReport({
      testResults: [{ assertionResults: [
        { fullName: "TP-025 concurrent booking", status: "passed", duration: 10 },
        { fullName: "TP-009 token rejected", status: "failed", duration: 5, failureMessages: ["oops"] },
        { fullName: "pending synthetic", status: "pending", duration: 0 }
      ] }]
    }, "backend-jest");
    expect(data.summary).toMatchObject({ total: 3, passed: 1, failed: 1, skipped: 1 });
    expect(data.testResults.map(test => test.id)).toEqual(["TP-025", "TP-009"]);
  });
});
