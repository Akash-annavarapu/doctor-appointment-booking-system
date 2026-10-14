const request = require("supertest");
const app = require("../app");
const TestRun = require("../models/TestRun");

const token = "test-only-report-ingestion-secret-long-enough";
const sample = () => ({
  runId: "test:report:backend:001",
  timestamp: new Date().toISOString(),
  suite: "integration-report-test",
  engine: "Static-CI",
  summary: { total: 2, passed: 1, failed: 0, skipped: 1, durationMs: 42 },
  testResults: [{
    id: "TP-025", title: "Concurrent double booking",
    category: "Edge Case", status: "PASS",
    executionTime: 42, errorLog: null
  }]
});

describe("Test run API", () => {
  beforeEach(async () => {
    process.env.REPORT_INGEST_TOKEN = token;
    await TestRun.deleteMany({});
  });
  afterAll(() => { delete process.env.REPORT_INGEST_TOKEN; });

  test("requires the ingestion secret", async () => {
    const res = await request(app).post("/api/reports/test-run").send(sample());
    expect(res.status).toBe(401);
    expect(await TestRun.countDocuments({})).toBe(0);
  });

  test("saves a valid run and exposes read-only dashboard metrics", async () => {
    const posted = await request(app).post("/api/reports/test-run")
      .set("X-TestPilot-Report-Token", token).send(sample());
    expect(posted.status).toBe(201);
    expect(posted.body.run.summary).toMatchObject({ passed: 1, skipped: 1 });
    const get = await request(app).get("/api/v1/reports/recent");
    expect(get.status).toBe(200);
    expect(get.body.runs).toHaveLength(1);
    expect(get.body.runs[0].testResults[0].id).toBe("TP-025");
    const again = await request(app).post("/api/reports/test-run")
      .set("X-TestPilot-Report-Token", token).send(sample());
    expect(again.status).toBe(200);
    expect(again.body.duplicate).toBe(true);
    expect(await TestRun.countDocuments({})).toBe(1);
  });

  test("rejects a summary inconsistent with test statuses", async () => {
    const broken = sample();
    broken.summary.failed = 1;
    const res = await request(app).post("/api/reports/test-run")
      .set("X-TestPilot-Report-Token", token).send(broken);
    expect(res.status).toBe(400);
  });
});
