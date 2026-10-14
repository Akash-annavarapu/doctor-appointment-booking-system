const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const nextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")].join("-");
};

describe("Public doctor availability (demo homepage)", () => {
  let doctor;
  let futureMonday;

  beforeEach(async () => {
    await Appointment.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});

    futureMonday = nextMonday();
    const account = await User.create({
      name: "Synthetic Doctor User",
      email: "publicslots@example.com",
      password: "fixture_password_hash_unused",
      phone: "9876543210",
      isDoctor: true,
    });

    doctor = await Doctor.create({
      userId: account._id,
      fullName: "Dr. Demo Test",
      phone: "9876543210",
      email: "publicslots@example.com",
      specialization: "General Medicine",
      experience: "5 years (fictional)",
      fees: 300,
      address: "Demo only",
      isDemo: true,
      status: "approved",
      slotDuration: 30,
      weeklyAvailability: [{
        day: "Monday", enabled: true,
        sessions: [{ startTime: "09:00", endTime: "12:00" }],
      }],
      blockedDates: [],
    });
  });

  test("lists real free slots for approved doctor without authentication", async () => {
    const result = await request(app).get("/api/v1/doctor/available-slots").query({
      doctorId: String(doctor._id),
      appointmentDate: futureMonday,
    });
    expect(result.status).toBe(200);
    expect(result.body.availableSlots).toEqual([
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    ]);
    expect(result.body).not.toHaveProperty("bookedSlots");
    expect(result.body).not.toHaveProperty("doctorSlots");
    expect(JSON.stringify(result.body)).not.toContain("userId");
  });

  test("removes an occupied slot from public availability", async () => {
    const account = await User.create({
      name: "Synthetic Patient",
      email: "slots-patient@example.com",
      password: "fixture_password_hash_unused",
      phone: "9876543211",
    });
    await Appointment.create({
      userId: account._id,
      doctorId: doctor._id,
      appointmentDate: futureMonday,
      appointmentTime: "09:00",
      status: "Pending",
    });

    const result = await request(app).get("/api/v1/doctor/available-slots").query({
      doctorId: String(doctor._id),
      appointmentDate: futureMonday,
    });
    expect(result.status).toBe(200);
    expect(result.body.availableSlots).not.toContain("09:00");
    expect(result.body.availableSlots).toContain("09:30");
  });

  test("rejects invalid and pending doctors", async () => {
    const malformed = await request(app).get("/api/v1/doctor/available-slots").query({
      doctorId: "not-an-id",
      appointmentDate: futureMonday,
    });
    expect(malformed.status).toBe(400);

    doctor.status = "pending";
    await doctor.save();

    const pending = await request(app).get("/api/v1/doctor/available-slots").query({
      doctorId: String(doctor._id),
      appointmentDate: futureMonday,
    });
    expect(pending.status).toBe(404);
  });
});
