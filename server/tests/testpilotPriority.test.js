const request = require("supertest");
const bcrypt = require("bcryptjs");

const app = require("../app");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const generateToken = require("../utils/generateToken");

// TESTPILOT: Traces selected scenarios in docs/TEST_CASE_MATRIX.md.
// Uses Jest's protected MONGO_URI_TEST database only (see tests/setup.js).
// These tests MUST NOT run against the deployed production database.

describe("TestPilot priority regression cases", () => {
  const registration = (overrides = {}) => ({
    name: "Synthetic TestPilot Patient",
    email: "testpilot.patient@example.com",
    password: "validpass123",
    phone: "9876543210",
    ...overrides,
  });

  beforeEach(async () => {
    await Appointment.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
  });

  test("TP-002: required registration field is rejected", async () => {
    const { phone, ...missingPhone } = registration();
    const response = await request(app).post("/api/v1/auth/register").send(missingPhone);
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(await User.countDocuments({})).toBe(0);
  });

  test("TP-003: rejects 7-character password", async () => {
    const response = await request(app).post("/api/v1/auth/register")
      .send(registration({ password: "abc1234" }));
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/at least 8 characters/i);
  });

  test("TP-004: accepts exactly 8-character password", async () => {
    const response = await request(app).post("/api/v1/auth/register")
      .send(registration({ password: "abc12345" }));
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("testpilot.patient@example.com");
    expect(response.body.token).toEqual(expect.any(String));
  });

  test("TP-006: rejects phone outside Indian mobile format", async () => {
    const response = await request(app).post("/api/v1/auth/register")
      .send(registration({ phone: "1234567890" }));
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/10-digit Indian mobile/i);
  });

  test("TP-009: GET /auth/me requires a token", async () => {
    const response = await request(app).get("/api/v1/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("TP-010 and TP-017: patient cannot list/approve pending doctors", async () => {
    const patient = await User.create({
      name: "Synthetic Patient",
      email: "patient.guard@example.com",
      phone: "9876543210",
      password: await bcrypt.hash("validpass123", 10),
    });
    const token = generateToken(patient._id);

    const list = await request(app)
      .get("/api/v1/admin/doctors/pending")
      .set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(403);

    const approve = await request(app)
      .put("/api/v1/admin/doctors/approve/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`);
    expect(approve.status).toBe(403);
  });

  test("TP-011: public discovery lists approved doctors only", async () => {
    const ownerA = await User.create({
      name: "Approved Doctor Account", email: "doca@example.com",
      phone: "9876543210", password: "hashed_fixture_password",
    });
    const ownerB = await User.create({
      name: "Pending Doctor Account", email: "docb@example.com",
      phone: "9876543211", password: "hashed_fixture_password",
    });

    const doctorDetails = {
      fullName: "Dr Synthetic Example",
      phone: "9876543212",
      specialization: "General",
      experience: "5 years",
      fees: 300,
      address: "Synthetic test clinic",
    };

    const approved = await Doctor.create({
      ...doctorDetails, userId: ownerA._id, email: "doca@example.com", status: "approved",
    });
    const pending = await Doctor.create({
      ...doctorDetails, userId: ownerB._id, email: "docb@example.com", status: "pending",
    });

    const response = await request(app).get("/api/v1/doctor/all");
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.doctors.map((doctor) => doctor._id)).toEqual([String(approved._id)]);
    expect(response.body.doctors.some((doctor) => doctor._id === String(pending._id))).toBe(false);
  });

  test("TP-012: no approved doctors gives a successful empty list", async () => {
    const response = await request(app).get("/api/v1/doctor/all");
    expect(response.status).toBe(200);
    expect(response.body.doctors).toEqual([]);
    expect(response.body.total).toBe(0);
  });
});
