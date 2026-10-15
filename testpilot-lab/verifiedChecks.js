"use strict";

// ONLY read-only GET assertions on known, public healthcare hosts.
// Never invoke signup, booking, schedule changes, admin mutations or file downloads here.
const FRONTEND = "https://doctor-appointment-frontend-9dbs.onrender.com";
const BACKEND = "https://doctor-appointment-booking-system-u1eq.onrender.com";
const CHECKS = Object.freeze([
  { id: "homepage-ui", stories: ["US-004"], title: "Healthcare homepage responds with a React mount",
    expected: "GET / returns HTTP 200 with an HTML React mount element." },
  { id: "approved-doctor-list", stories: ["US-005"], title: "Approved doctor listing is readable",
    expected: "GET /api/v1/doctor/all returns HTTP 200 and a doctors array." },
  { id: "approved-doctor-detail", stories: ["US-006"], title: "An approved doctor detail can be retrieved",
    expected: "GET /api/v1/doctor/:id returns HTTP 200 for a publicly listed doctor." },
  { id: "public-open-slots", stories: ["US-007"], title: "Public doctor slot availability returns a safe list",
    expected: "GET /api/v1/doctor/available-slots returns HTTP 200 and an availableSlots array." },
  { id: "session-auth-required", stories: ["US-003"], title: "Unauthenticated profile access is blocked",
    expected: "GET /api/v1/auth/me without an access token returns HTTP 401." },
  { id: "admin-queue-auth-required", stories: ["US-010"], title: "Anonymous users cannot inspect admin review queue",
    expected: "GET /api/v1/admin/doctors/pending without an access token returns HTTP 401." },
  { id: "patient-history-auth-required", stories: ["US-019"], title: "Anonymous users cannot inspect patient appointment history",
    expected: "GET /api/v1/appointment/user without an access token returns HTTP 401." },
  { id: "doctor-history-auth-required", stories: ["US-020"], title: "Anonymous users cannot inspect assigned doctor appointments",
    expected: "GET /api/v1/appointment/doctor without an access token returns HTTP 401." },
  { id: "notifications-auth-required", stories: ["US-025"], title: "Anonymous users cannot inspect private notifications",
    expected: "GET /api/v1/notification/ without an access token returns HTTP 401." }
]);

function checksForStory(storyId) {
  return CHECKS.filter(check => check.stories.includes(storyId)).map(({ id, title, expected }) =>
    ({ id, title, expected, method: "GET", safety: "Public read-only HTTP assertion" }));
}

async function request(url, fetchImpl) {
  if (![FRONTEND, BACKEND].includes(new URL(url).origin)) throw Error("Unapproved test target.");
  const response = await fetchImpl(url, {
    method: "GET",
    redirect: "error",
    headers: { Accept: "application/json, text/html" },
    signal: AbortSignal.timeout(25000)
  });
  return response;
}

async function runCheck(check, fetchImpl) {
  const start = Date.now();
  let status = "FAIL";
  let actual = "";
  try {
    let url, expectedStatus = 200;
    switch (check.id) {
      case "homepage-ui": {
        const response = await request(FRONTEND + "/", fetchImpl);
        const html = response.status === 200 ? await response.text() : "";
        status = response.status === 200 && /id=["']root["']/.test(html) ? "PASS" : "FAIL";
        actual = "HTTP " + response.status + "; React root " + (/<(?:div|main)[^>]*id=["']root["']/.test(html) ? "present" : "not verified");
        break;
      }
      case "approved-doctor-list":
      case "approved-doctor-detail":
      case "public-open-slots": {
        const listResponse = await request(BACKEND + "/api/v1/doctor/all", fetchImpl);
        if (listResponse.status !== 200) {
          actual = "Doctor catalog HTTP " + listResponse.status;
          break;
        }
        const catalog = await listResponse.json();
        if (!catalog.success || !Array.isArray(catalog.doctors)) {
          actual = "Doctor catalog JSON schema invalid";
          break;
        }
        if (check.id === "approved-doctor-list") {
          status = "PASS";
          actual = "HTTP 200; array contains " + catalog.doctors.length + " approved doctor records";
          break;
        }
        const candidates = catalog.doctors.filter(d => /^[a-f0-9]{24}$/i.test(String(d._id || "")));
        if (!candidates.length) {
          status = "SKIPPED";
          actual = "No eligible approved doctor fixture currently listed; no mutation performed";
          break;
        }
        if (check.id === "approved-doctor-detail") {
          const detail = await request(BACKEND + "/api/v1/doctor/" + candidates[0]._id, fetchImpl);
          const payload = detail.status === 200 ? await detail.json() : null;
          status = detail.status === 200 && payload?.success &&
            String(payload.doctor?._id) === String(candidates[0]._id) ? "PASS" : "FAIL";
          actual = "Public approved-doctor detail HTTP " + detail.status +
            "; matching doctor response " + (status === "PASS" ? "verified" : "not verified");
          break;
        }
        let fixture;
        const today = new Date();
        for (let plus = 2; plus <= 14 && !fixture; plus++) {
          const dt = new Date(today);
          dt.setUTCDate(dt.getUTCDate() + plus);
          const day = dt.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
          const doctor = candidates.find(d => d.weeklyAvailability?.some(w =>
            w.day === day && w.enabled && Array.isArray(w.sessions) && w.sessions.length));
          if (doctor) fixture = { date: dt.toISOString().slice(0, 10), id: doctor._id };
        }
        if (!fixture) {
          status = "SKIPPED";
          actual = "No approved future-day timetable fixture is configured; no mutation performed";
          break;
        }
        const target = new URL(BACKEND + "/api/v1/doctor/available-slots");
        target.searchParams.set("doctorId", fixture.id);
        target.searchParams.set("appointmentDate", fixture.date);
        const response = await request(target.toString(), fetchImpl);
        const payload = response.status === 200 ? await response.json() : null;
        status = response.status === 200 && payload?.success &&
          Array.isArray(payload.availableSlots) &&
          !Object.hasOwn(payload, "appointments") && !Object.hasOwn(payload, "bookedSlots")
          ? "PASS" : "FAIL";
        actual = "Slots HTTP " + response.status + "; public slots schema " +
          (status === "PASS" ? "valid" : "not verified") + "; date " + fixture.date;
        break;
      }
      case "session-auth-required": url = BACKEND + "/api/v1/auth/me"; expectedStatus = 401; break;
      case "admin-queue-auth-required": url = BACKEND + "/api/v1/admin/doctors/pending"; expectedStatus = 401; break;
      case "patient-history-auth-required": url = BACKEND + "/api/v1/appointment/user"; expectedStatus = 401; break;
      case "doctor-history-auth-required": url = BACKEND + "/api/v1/appointment/doctor"; expectedStatus = 401; break;
      case "notifications-auth-required": url = BACKEND + "/api/v1/notification/"; expectedStatus = 401; break;
      default: throw Error("Unknown approved probe.");
    }
    if (url) {
      const response = await request(url, fetchImpl);
      status = response.status === expectedStatus ? "PASS" : "FAIL";
      actual = "HTTP " + response.status + " (expected " + expectedStatus + ")";
    }
  } catch (error) {
    actual = "Read-only assertion could not complete: " +
      (error.name === "TimeoutError" ? "request timeout" : "remote fetch or response validation error");
  }
  return {
    id: check.id, title: check.title, expected: check.expected,
    status, actual, executionTime: Math.max(0, Date.now() - start),
    scope: "VERIFIED_READ_ONLY_PROBE"
  };
}

async function executeStoryChecks(storyId, { fetchImpl = fetch } = {}) {
  const checks = CHECKS.filter(check => check.stories.includes(storyId));
  const started = Date.now();
  const results = checks.length
    ? await Promise.all(checks.map(check => runCheck(check, fetchImpl)))
    : [{
      id: "not-automated", title: "Full workflow requires isolated test automation",
      expected: "Review case and execute in isolated staging/CI using synthetic fixtures.",
      status: "SKIPPED",
      actual: "No safe production read-only probe matches this story; no live write performed",
      executionTime: 0, scope: "UNSUPPORTED_IN_LIVE_READ_ONLY_MODE"
    }];
  return {
    runId: "lab-" + require("node:crypto").randomUUID(),
    timestamp: new Date().toISOString(), storyId,
    suite: "Read-only healthcare live contract probes",
    executionScope: "SAFE_LIVE_READ_ONLY",
    generatedTestsExecuted: false,
    summary: {
      total: results.length, passed: results.filter(r => r.status === "PASS").length,
      failed: results.filter(r => r.status === "FAIL").length,
      skipped: results.filter(r => r.status === "SKIPPED").length,
      durationMs: Date.now() - started
    },
    results
  };
}

module.exports = { CHECKS, FRONTEND, BACKEND, checksForStory, executeStoryChecks, request };
