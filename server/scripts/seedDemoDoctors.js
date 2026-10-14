const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const examples = require("./demoDoctorData");

// This is intentionally an explicit ONE-OFF script, never a startup hook.
// Usage: SEED_DEMO_DOCTORS=true MONGO_URI=<test-or-authorized-demo-uri> node scripts/seedDemoDoctors.js
async function seed() {
  if (process.env.SEED_DEMO_DOCTORS !== "true") {
    throw new Error("Refusing to seed without SEED_DEMO_DOCTORS=true.");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("Set MONGO_URI for the authorized demo database.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  let created = 0;
  let skipped = 0;

  for (const example of examples) {
    let user = await User.findOne({ email: example.email });

    if (!user) {
      const randomPassword = crypto.randomBytes(48).toString("hex");
      user = await User.create({
        name: example.fullName,
        email: example.email,
        phone: example.phone,
        password: await bcrypt.hash(randomPassword, 12),
        isDoctor: true,
      });
    } else if (!user.isDoctor || user.isAdmin) {
      // Never reassign existing user roles or modify non-demo accounts.
      throw new Error(`Existing account collision for ${example.email}`);
    }

    const existing = await Doctor.findOne({ userId: user._id });
    if (existing) {
      if (!existing.isDemo) throw new Error(`Non-demo doctor collision: ${example.email}`);
      skipped += 1;
      continue;
    }

    await Doctor.create({
      ...example,
      userId: user._id,
      isDemo: true,
      status: "approved",
      timings: [],
      blockedDates: [],
    });
    created += 1;
  }

  console.log(`Demo profiles created: ${created}; already present: ${skipped}`);
}

seed()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
