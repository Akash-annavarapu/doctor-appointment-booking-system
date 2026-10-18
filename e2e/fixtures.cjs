const { test: base, expect } = require("@playwright/test");

const doctors = [
  {
    _id: "507f1f77bcf86cd799439011",
    fullName: "Dr. Demo Maya Rao",
    specialization: "Cardiology",
    experience: "8 years (fictional)",
    fees: 500,
    isDemo: true,
    slotDuration: 30,
    weeklyAvailability: [
      { day: "Monday", enabled: true, sessions: [{ startTime: "09:00", endTime: "12:00" }] }
    ]
  },
  {
    _id: "507f1f77bcf86cd799439012",
    fullName: "Dr. Demo Dev Patel",
    specialization: "Dermatology",
    experience: "6 years (fictional)",
    fees: 400,
    isDemo: true,
    slotDuration: 30,
    weeklyAvailability: [
      { day: "Tuesday", enabled: true, sessions: [{ startTime: "10:00", endTime: "13:00" }] }
    ]
  }
];

const test = base.extend({
  page: async ({ page }, use) => {
    // All healthcare API traffic stays inside browser fixtures. Reject all writes.
    await page.route("**/api/v1/**", async route => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      const reply = (status, body) => route.fulfill({
        status, contentType: "application/json", body: JSON.stringify(body)
      });
      if (req.method() !== "GET") {
        return reply(405, { success: false, message: "Writes blocked by synthetic browser test." });
      }
      if (path.endsWith("/doctor/all")) return reply(200, { success: true, doctors });
      if (path.endsWith("/doctor/available-slots")) {
        return reply(200, { success: true, availableSlots: ["09:00", "09:30"] });
      }
      if (path.endsWith("/reports/recent")) return reply(200, { success: true, runs: [] });
      return reply(404, { success: false, message: "No fixture for this read-only route." });
    });
    await use(page);
  }
});

module.exports = { test, expect };
