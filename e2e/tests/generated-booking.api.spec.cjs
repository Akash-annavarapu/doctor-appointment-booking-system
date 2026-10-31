"use strict";

// Human-review-ready Playwright execution of four genuine Gemini case *intents*
// from US-017 (2026-10-26 exported evidence), plus an additional concurrency edge.
// No model code is evaluated. All HTTP requests go to an isolated localhost API;
// synthetic patient/doctor records live only in a local MongoDB *_test database.
const { test, expect } = require("@playwright/test");
const mongoose = require("../../server/node_modules/mongoose");
const bcrypt = require("../../server/node_modules/bcryptjs");
const User = require("../../server/models/User");
const Doctor = require("../../server/models/Doctor");
const Appointment = require("../../server/models/Appointment");
const Notification = require("../../server/models/Notification");
const generateToken = require("../../server/utils/generateToken");

const API = "http://127.0.0.1:5199";
const TEST_URI = "mongodb://127.0.0.1:27017/testpilot_generated_test";
const enabled = process.env.TESTPILOT_ISOLATED_API === "1";

function assertIsolated() {
  if (process.env.NODE_ENV !== "test" ||
      process.env.MONGO_URI_TEST !== TEST_URI ||
      process.env.MONGO_URI !== TEST_URI ||
      process.env.TESTPILOT_ISOLATED_API !== "1") {
    throw Error("Refusing generated-case execution without the fixed localhost *_test database.");
  }
}

function futureMonday() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + ((8 - date.getDay()) % 7) + 14);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")].join("-");
}

test.describe("US-017 genuine Gemini booking candidates — isolated Playwright API", () => {
  test.skip(!enabled, "Only run with TESTPILOT_ISOLATED_API=1 and isolated MongoDB.");
  test.describe.configure({ mode: "serial" });

  let date, doctorId, patientToken, secondPatientToken;

  test.beforeAll(async () => {
    assertIsolated();
    await mongoose.connect(TEST_URI);
    await Appointment.init(); // ensure partial unique slot index before concurrency checks
  });

  test.afterAll(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

  test.beforeEach(async () => {
    assertIsolated();
    // Dedicated database, never production; remove fixtures after the prior test.
    await Promise.all([
      Appointment.deleteMany({}), Notification.deleteMany({}),
      Doctor.deleteMany({}), User.deleteMany({})
    ]);
    const password = await bcrypt.hash("SyntheticPassword123", 10);
    const patient = await User.create({
      name: "Synthetic Patient", email: "patient1@example.invalid",
      password, phone: "9876543210"
    });
    const second = await User.create({
      name: "Synthetic Second Patient", email: "patient2@example.invalid",
      password, phone: "9876543211"
    });
    const doctorUser = await User.create({
      name: "Synthetic Doctor", email: "doctor@example.invalid",
      password, phone: "9876543212", isDoctor: true
    });
    date = futureMonday();
    const doctor = await Doctor.create({
      userId: doctorUser._id, fullName: "Dr Synthetic Booking",
      phone: "9876543212", email: "doctor@example.invalid",
      specialization: "General Medicine", experience: "5 years",
      fees: 500, address: "Fictional Clinic",
      weeklyAvailability: [{ day: "Monday", enabled: true,
        sessions: [{ startTime: "09:00", endTime: "11:00" }] }],
      slotDuration: 30, status: "approved"
    });
    doctorId = doctor._id.toString();
    patientToken = generateToken(patient._id);
    secondPatientToken = generateToken(second._id);
  });

  function postBooking(request, token, time = "09:00", overrides = {}) {
    return request.post(API + "/api/v1/appointment/book", {
      headers: token ? { Authorization: "Bearer " + token } : {},
      data: { doctorId, appointmentDate: date, appointmentTime: time, ...overrides }
    });
  }

  test("AI-001 POSITIVE | valid booking creates exactly one Pending appointment", async ({ request }) => {
    const response = await postBooking(request, patientToken);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.appointment.status).toBe("Pending");
    expect(body.appointment.appointmentTime).toBe("09:00");
    expect(await Appointment.countDocuments({ doctorId, appointmentDate: date,
      appointmentTime: "09:00", status: "Pending" })).toBe(1);
  });

  test("AI-002 NEGATIVE | already reserved slot returns conflict and no duplicate", async ({ request }) => {
    const first = await postBooking(request, patientToken, "09:30");
    expect(first.status()).toBe(201);
    const second = await postBooking(request, secondPatientToken, "09:30");
    expect(second.status()).toBe(409);
    expect((await second.json()).success).toBe(false);
    expect(await Appointment.countDocuments({ doctorId, appointmentDate: date,
      appointmentTime: "09:30", status: { $in: ["Pending", "Approved"] } })).toBe(1);
  });

  test("AI-003 NEGATIVE | missing mandatory booking fields are rejected", async ({ request }) => {
    const response = await postBooking(request, patientToken, "09:00",
      { doctorId: "", appointmentDate: "", appointmentTime: "" });
    expect(response.status()).toBe(400);
    expect((await response.json()).success).toBe(false);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test("AI-004 SECURITY | unauthenticated booking is denied", async ({ request }) => {
    const response = await postBooking(request, null);
    expect(response.status()).toBe(401);
    expect((await response.json()).success).toBe(false);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test("US-018 EDGE | concurrent patients cannot double-book the same slot", async ({ request }) => {
    const replies = await Promise.all([
      postBooking(request, patientToken, "10:00"),
      postBooking(request, secondPatientToken, "10:00")
    ]);
    expect(replies.map(r => r.status()).sort()).toEqual([201, 409]);
    expect(await Appointment.countDocuments({ doctorId, appointmentDate: date,
      appointmentTime: "10:00", status: { $in: ["Pending", "Approved"] } })).toBe(1);
  });
});
