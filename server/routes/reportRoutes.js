const express = require("express");
const crypto = require("node:crypto");
const TestRun = require("../models/TestRun");
const { events, validateReport, publicReport, ReportError } = require("../services/testRunReporting");

const router = express.Router();

function authorizeReporter(req, res, next) {
  const expected = process.env.REPORT_INGEST_TOKEN;
  if (!expected || expected.length < 24) {
    return res.status(503).json({ success: false, message: "Report ingestion is not configured." });
  }
  const incoming = req.get("X-TestPilot-Report-Token") || "";
  const a = Buffer.from(expected);
  const b = Buffer.from(incoming);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, message: "Invalid report token." });
  }
  next();
}

router.post("/test-run", authorizeReporter, async (req, res) => {
  try {
    const payload = validateReport(req.body);
    const previous = await TestRun.findOne({ runId: payload.runId });
    if (previous) {
      return res.status(200).json({ success: true, duplicate: true, run: publicReport(previous.toObject()) });
    }
    const stored = await TestRun.create(payload);
    const run = publicReport(stored.toObject());
    events.emit("report", run);
    return res.status(201).json({ success: true, run });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate run ID." });
    }
    if (!(error instanceof ReportError)) console.error("Report ingestion error:", error);
    return res.status(error instanceof ReportError ? error.status : 500).json({
      success: false,
      message: error instanceof ReportError ? error.message : "Unable to save report."
    });
  }
});

router.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 30);
    const stored = await TestRun.find({}).sort({ timestamp: -1 }).limit(limit).lean();
    return res.json({ success: true, runs: stored.map(publicReport) });
  } catch {
    return res.status(503).json({ success: false, message: "Reports unavailable." });
  }
});

// Per-instance low-latency updates; the browser also polls to handle multi-instance Render deployments.
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(": connected\n\n");
  const emit = run => res.write("event: report\ndata: " + JSON.stringify(run) + "\n\n");
  events.on("report", emit);
  const timer = setInterval(() => res.write(": heartbeat\n\n"), 20000);
  req.on("close", () => {
    clearInterval(timer);
    events.off("report", emit);
  });
});

module.exports = router;
