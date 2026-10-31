const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, enum: ["Edge Case", "Happy Path", "Security"], required: true },
  status: { type: String, enum: ["PASS", "FAIL"], required: true },
  executionTime: { type: Number, required: true, min: 0 },
  errorLog: { type: String, default: null },
  screenshotBase64: { type: String, default: null }
}, { _id: false });

const runSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true, index: true },
  suite: { type: String, required: true },
  engine: { type: String, enum: ["LLM-Generated", "Static-CI"], required: true },
  summary: {
    total: { type: Number, required: true, min: 0 },
    passed: { type: Number, required: true, min: 0 },
    failed: { type: Number, required: true, min: 0 },
    skipped: { type: Number, required: true, min: 0 },
    durationMs: { type: Number, required: true, min: 0 }
  },
  testResults: { type: [testResultSchema], default: [] }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("TestRun", runSchema);
