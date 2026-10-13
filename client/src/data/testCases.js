// Source: docs/TEST_CASE_MATRIX.md (Milestone 2).
// Curated, read-only design catalog. Status is never inferred from passing CI tests.
// Keep IDs, rules and expected outcomes in sync with the document.
export const TEST_CASES = [
  {
    "id": "TP-001",
    "useCase": "UC-01",
    "category": "Positive",
    "scenario": "Register with unique email, valid name/password/mobile",
    "expected": "Account created; token returned; 201",
    "evidence": "authController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Create a unique synthetic patient account with valid fields and submit registration."
  },
  {
    "id": "TP-002",
    "useCase": "UC-01",
    "category": "Negative",
    "scenario": "Missing one required registration field",
    "expected": "Rejected; 400",
    "evidence": "authController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Omit one required field in a synthetic registration request."
  },
  {
    "id": "TP-003",
    "useCase": "UC-01",
    "category": "Boundary",
    "scenario": "Password is 7 characters",
    "expected": "Rejected; 400",
    "evidence": "authController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Submit otherwise valid registration fields with a 7-character password."
  },
  {
    "id": "TP-004",
    "useCase": "UC-01",
    "category": "Boundary",
    "scenario": "Valid 8-character password",
    "expected": "Accepted when other fields valid; 201",
    "evidence": "authController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Submit otherwise valid registration fields with an 8-character password."
  },
  {
    "id": "TP-005",
    "useCase": "UC-01",
    "category": "Negative",
    "scenario": "Reuse existing email (case normalized)",
    "expected": "Duplicate rejected; 409",
    "evidence": "authController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Create a synthetic account, then repeat its email using different letter case."
  },
  {
    "id": "TP-006",
    "useCase": "UC-01",
    "category": "Negative",
    "scenario": "Phone not matching 10-digit Indian mobile pattern",
    "expected": "Rejected; 400",
    "evidence": "authController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Submit registration with a phone number outside the accepted Indian-mobile format."
  },
  {
    "id": "TP-007",
    "useCase": "UC-02",
    "category": "Positive",
    "scenario": "Correct email and password",
    "expected": "Token + user returned; 200; correct dashboard",
    "evidence": "authController.js; Login.jsx",
    "priority": "P0",
    "status": "Not run",
    "steps": "Log in as a registered synthetic patient and inspect the returned session and dashboard."
  },
  {
    "id": "TP-008",
    "useCase": "UC-02",
    "category": "Negative",
    "scenario": "Wrong password",
    "expected": "No token; 401",
    "evidence": "authController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Log in with an existing account email and an incorrect password."
  },
  {
    "id": "TP-009",
    "useCase": "UC-03",
    "category": "Security",
    "scenario": "Fetch GET /auth/me without token",
    "expected": "Unauthorized; 401 (validate middleware response)",
    "evidence": "authRoutes.js; authMiddleware.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Request the authenticated-profile API without an Authorization header."
  },
  {
    "id": "TP-010",
    "useCase": "UC-15",
    "category": "Authorization",
    "scenario": "Patient requests admin doctor-approval route",
    "expected": "Forbidden; 403",
    "evidence": "adminRoutes.js; roleMiddleware.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Authenticate as a patient and request an administrator-only doctor approval endpoint."
  },
  {
    "id": "TP-011",
    "useCase": "UC-04",
    "category": "Positive",
    "scenario": "GET /doctor/all with one approved and one pending doctor",
    "expected": "200; approved is visible, pending hidden",
    "evidence": "doctorController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Seed one approved and one pending synthetic doctor, then fetch the public doctor list."
  },
  {
    "id": "TP-012",
    "useCase": "UC-04",
    "category": "Empty data",
    "scenario": "No approved doctors exist",
    "expected": "200 with empty doctors array; UI shows no-approved-doctors state",
    "evidence": "FeaturedDoctors.jsx; doctorController.js",
    "priority": "P2",
    "status": "Not run",
    "steps": "Use an empty approved-doctor fixture and load the homepage doctor section."
  },
  {
    "id": "TP-013",
    "useCase": "UC-04",
    "category": "Negative",
    "scenario": "GET /doctor/:id with invalid MongoDB ObjectId",
    "expected": "Validation error (client error)",
    "evidence": "doctorRoutes.js; validateObjectId.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Request a doctor profile using an invalid MongoDB ObjectId."
  },
  {
    "id": "TP-014",
    "useCase": "UC-05",
    "category": "Positive",
    "scenario": "Authenticated patient submits valid doctor application",
    "expected": "New application pending, 201",
    "evidence": "doctorController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "As a synthetic patient, submit valid professional details and a weekly schedule."
  },
  {
    "id": "TP-015",
    "useCase": "UC-05",
    "category": "State",
    "scenario": "Submit another application while first pending",
    "expected": "Rejected; 400",
    "evidence": "doctorController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Submit a second application while the same synthetic user's first is pending."
  },
  {
    "id": "TP-016",
    "useCase": "UC-06",
    "category": "Positive",
    "scenario": "Admin approves pending application",
    "expected": "200; doctor becomes approved, user gains doctor role",
    "evidence": "adminController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "As a test administrator, approve a pending synthetic doctor application."
  },
  {
    "id": "TP-017",
    "useCase": "UC-06",
    "category": "Authorization",
    "scenario": "Patient attempts doctor approval",
    "expected": "Forbidden; 403",
    "evidence": "adminRoutes.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "As a patient, attempt to approve another doctor's pending application."
  },
  {
    "id": "TP-018",
    "useCase": "UC-07",
    "category": "Boundary",
    "scenario": "Set appointment slot duration to 10 minutes",
    "expected": "Rejected; 400",
    "evidence": "doctorController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "As a doctor, submit an unsupported 10-minute appointment slot duration."
  },
  {
    "id": "TP-019",
    "useCase": "UC-07",
    "category": "Positive",
    "scenario": "Doctor sets valid weekly sessions and 30-minute slots",
    "expected": "Profile/schedule updated; 200",
    "evidence": "doctorController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "As an approved doctor, update the weekly session timetable and slot duration."
  },
  {
    "id": "TP-020",
    "useCase": "UC-08",
    "category": "Negative",
    "scenario": "Request slots for a past date",
    "expected": "Rejected; 400",
    "evidence": "appointmentController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Request a doctor's available slots for yesterday."
  },
  {
    "id": "TP-021",
    "useCase": "UC-08",
    "category": "Boundary/state",
    "scenario": "Request a configured blocked date",
    "expected": "200; no available slots",
    "evidence": "appointmentController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Request slots for a date in the doctor's blockedDates array."
  },
  {
    "id": "TP-022",
    "useCase": "UC-08",
    "category": "State",
    "scenario": "Doctor disabled on requested weekday",
    "expected": "200; zero slots",
    "evidence": "appointmentController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Request slots for a weekday marked disabled in weeklyAvailability."
  },
  {
    "id": "TP-023",
    "useCase": "UC-09",
    "category": "Positive",
    "scenario": "Patient books a valid future free slot",
    "expected": "Appointment Pending; 201",
    "evidence": "appointmentController.js; Appointment.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "As a patient, book an approved doctor's free future time slot."
  },
  {
    "id": "TP-024",
    "useCase": "UC-09",
    "category": "Negative",
    "scenario": "Book time outside doctor's working sessions",
    "expected": "Rejected; 400",
    "evidence": "appointmentController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Try to book a time that falls outside a doctor's configured sessions."
  },
  {
    "id": "TP-025",
    "useCase": "UC-09",
    "category": "Concurrency",
    "scenario": "Two patients race for same doctor/date/time",
    "expected": "Exactly one active booking; loser receives conflict 409",
    "evidence": "Appointment.js unique index; appointmentController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Using two independent synthetic patients, submit the same free slot concurrently."
  },
  {
    "id": "TP-026",
    "useCase": "UC-09",
    "category": "Negative",
    "scenario": "Book an already occupied active slot",
    "expected": "Rejected; 409",
    "evidence": "appointmentController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Book an active slot once, then try to book the same doctor, date and time again."
  },
  {
    "id": "TP-027",
    "useCase": "UC-13",
    "category": "Validation",
    "scenario": "Upload unsupported file MIME type",
    "expected": "Rejected; 400",
    "evidence": "medicalDocumentUpload.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Attach a synthetic file with an unsupported MIME type to the booking request."
  },
  {
    "id": "TP-028",
    "useCase": "UC-13",
    "category": "Boundary",
    "scenario": "Upload file exceeding 5 MiB",
    "expected": "Upload rejected (assert actual middleware code + cleanup)",
    "evidence": "medicalDocumentUpload.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Attach a synthetic file larger than 5 MiB to the booking request."
  },
  {
    "id": "TP-029",
    "useCase": "UC-10",
    "category": "Authorization",
    "scenario": "Patient A fetches GET /appointment/user",
    "expected": "Only patient A's appointments returned; 200",
    "evidence": "appointmentController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "As patient A, fetch appointments after creating records for patients A and B."
  },
  {
    "id": "TP-030",
    "useCase": "UC-11",
    "category": "Authorization",
    "scenario": "Doctor A fetches GET /appointment/doctor",
    "expected": "Only assigned appointments; 200",
    "evidence": "appointmentController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "As doctor A, fetch doctor appointments after creating records for doctors A and B."
  },
  {
    "id": "TP-031",
    "useCase": "UC-12",
    "category": "Positive",
    "scenario": "Doctor changes Pending → Approved",
    "expected": "Updated; 200",
    "evidence": "appointmentController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "As the assigned doctor, approve a pending appointment."
  },
  {
    "id": "TP-032",
    "useCase": "UC-12",
    "category": "State",
    "scenario": "Doctor attempts Completed → Pending",
    "expected": "Transition rejected; 409",
    "evidence": "appointmentController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "Attempt to transition a completed appointment back to pending."
  },
  {
    "id": "TP-033",
    "useCase": "UC-12",
    "category": "Authorization",
    "scenario": "Doctor B tries changing Doctor A's appointment",
    "expected": "Not found/unauthorized; 404",
    "evidence": "appointmentController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "As doctor B, attempt to update doctor A's appointment."
  },
  {
    "id": "TP-034",
    "useCase": "UC-13",
    "category": "Security",
    "scenario": "Doctor B requests Doctor A appointment's medical file",
    "expected": "Not found/unauthorized; 404",
    "evidence": "appointmentController.js",
    "priority": "P0",
    "status": "Not run",
    "steps": "As doctor B, request a medical file attached to doctor A's appointment."
  },
  {
    "id": "TP-035",
    "useCase": "UC-14",
    "category": "Positive",
    "scenario": "User fetches own notifications",
    "expected": "200, unread count and own list",
    "evidence": "notificationController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "Fetch notifications with an authenticated synthetic user token."
  },
  {
    "id": "TP-036",
    "useCase": "UC-14",
    "category": "Security",
    "scenario": "User A attempts to mark User B notification read",
    "expected": "Not found; 404",
    "evidence": "notificationController.js",
    "priority": "P1",
    "status": "Not run",
    "steps": "As user A, attempt to mark user B's notification as read."
  }
];

export const TEST_CASE_CATEGORIES = [...new Set(TEST_CASES.map((item) => item.category))].sort();
export const TEST_CASE_USE_CASES = [...new Set(TEST_CASES.map((item) => item.useCase))].sort();
