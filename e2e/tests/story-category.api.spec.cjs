"use strict";

// Extra source-derived coverage for registration and approved-doctor discovery.
// These are NOT claimed to be executions of the archived Gemini cases; they
// demonstrate positive, negative and boundary scenarios through Playwright.
const { test, expect } = require("@playwright/test");
const mongoose = require("../../server/node_modules/mongoose");
const User = require("../../server/models/User");
const Doctor = require("../../server/models/Doctor");
const Appointment = require("../../server/models/Appointment");
const Notification = require("../../server/models/Notification");
const bcrypt = require("../../server/node_modules/bcryptjs");
const API = "http://127.0.0.1:5199";
const URI = "mongodb://127.0.0.1:27017/testpilot_generated_test";
const enabled = process.env.TESTPILOT_ISOLATED_API === "1";

test.describe("Source-derived positive / negative / boundary API scenarios", () => {
  test.skip(!enabled, "Only runs with isolated test database and localhost API.");
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    if (process.env.NODE_ENV !== "test" ||
        process.env.MONGO_URI !== URI ||
        process.env.MONGO_URI_TEST !== URI ||
        !enabled) throw Error("Isolated database safety guard rejected environment.");
    await mongoose.connect(URI);
  });
  test.afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
  test.beforeEach(async () => {
    await Appointment.deleteMany({});
    await Notification.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
  });

  const registration = (password = "ValidPass123") => ({
    name: "Synthetic Registrant", email: "registrant@example.invalid",
    password, phone: "9876543210"
  });

  test("US-001 POSITIVE | valid registration returns a token and persisted user", async ({ request }) => {
    const response = await request.post(API + "/api/v1/auth/register", {
      data: registration()
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
    expect(await User.countDocuments({ email: registration().email })).toBe(1);
  });

  test("US-001 NEGATIVE | 7-character password is rejected with no user stored", async ({ request }) => {
    const response = await request.post(API + "/api/v1/auth/register", {
      data: registration("Short12")
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).success).toBe(false);
    expect(await User.countDocuments()).toBe(0);
  });

  test("US-001 BOUNDARY | exactly 8-character password is accepted", async ({ request }) => {
    const response = await request.post(API + "/api/v1/auth/register", {
      data: registration("Valid123")
    });
    expect(response.status()).toBe(201);
    expect(await User.countDocuments()).toBe(1);
  });

  async function createDoctor(status, suffix) {
    const password = await bcrypt.hash("SyntheticPass123", 10);
    const user = await User.create({
      name: "Synthetic Doctor " + suffix,
      email: "doctor" + suffix + "@example.invalid",
      password, phone: "987654321" + suffix, isDoctor: true
    });
    return Doctor.create({
      userId: user._id, fullName: "Dr Synthetic " + suffix,
      email: user.email, phone: user.phone, specialization: "Cardiology",
      experience: "3 years", fees: 300, address: "Test Clinic",
      slotDuration: 30, status,
      weeklyAvailability: [{ day: "Monday", enabled: true,
        sessions: [{ startTime: "09:00", endTime: "10:00" }] }]
    });
  }

  test("US-005 POSITIVE/NEGATIVE | only approved doctors are returned", async ({ request }) => {
    const approved = await createDoctor("approved", "3");
    await createDoctor("pending", "4");
    const response = await request.get(API + "/api/v1/doctor/all");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.doctors).toHaveLength(1);
    expect(body.doctors[0]._id).toBe(approved._id.toString());
    expect(body.doctors[0]).not.toHaveProperty("email");
  });

  test("US-005 EDGE | empty approved directory returns a valid empty array", async ({ request }) => {
    await createDoctor("pending", "5");
    const response = await request.get(API + "/api/v1/doctor/all");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.total).toBe(0);
    expect(body.doctors).toEqual([]);
  });
});
