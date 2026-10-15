# Week 5 — 25 Role-Based Healthcare User Stories

> Submission evidence for Kavi sir: 25 user stories for the existing deployed GitHub healthcare application. These are **documented requirements**, not LLM-generated or executed test results.

**Existing deployed application:** https://doctor-appointment-frontend-9dbs.onrender.com/  
**Original open-source reference:** https://github.com/gantasrinivasarao96/doctor-appointment-booking-system  
**Adapted GitHub repository:** https://github.com/Akash-annavarapu/doctor-appointment-booking-system  
**Separate independent testing app:** testpilot-lab/ (must be independently deployed).

## Scope and method

Each story follows the standard requirement format: **As a [role], I want [action], so that [benefit].** We mapped it to the actual 15 documented application use cases, real frontend/backend functionality, code anchor, and checkable acceptance criteria. This does not mean all user-story acceptance criteria have been exercised on the deployed production system.

## Summary matrix

| Story ID | Actor | User story | Use case | Code-grounded route |
|---|---|---|---|---|
| US-001 | Visitor | Register as patient | UC-01 | POST /api/v1/auth/register |
| US-002 | Visitor | Sign in securely | UC-02 | POST /api/v1/auth/login |
| US-003 | Authenticated user | View my account | UC-03 | GET /api/v1/auth/me |
| US-004 | Authenticated user | Access role-specific dashboards | UC-15 | UI / |
| US-005 | Visitor | Browse approved doctors | UC-04 | GET /api/v1/doctor/all |
| US-006 | Visitor | View doctor details | UC-04 | GET /api/v1/doctor/:id |
| US-007 | Visitor | Check public available slots | UC-08 | GET /api/v1/doctor/available-slots |
| US-008 | Patient | Apply to become a doctor | UC-05 | POST /api/v1/doctor/apply |
| US-009 | Patient | Prevent duplicate pending application | UC-05 | POST /api/v1/doctor/apply |
| US-010 | Administrator | List pending doctor applications | UC-06 | GET /api/v1/admin/doctors/pending |
| US-011 | Administrator | Approve a doctor | UC-06 | PUT /api/v1/admin/doctors/approve/:id |
| US-012 | Administrator | Reject a doctor application | UC-06 | PUT /api/v1/admin/doctors/reject/:id |
| US-013 | Doctor | Edit professional profile | UC-07 | PUT /api/v1/doctor/profile |
| US-014 | Doctor | Configure weekly working schedule | UC-07 | PUT /api/v1/doctor/profile |
| US-015 | Doctor | Block unavailable dates | UC-07 | PUT /api/v1/doctor/profile |
| US-016 | Patient | Find authenticated appointment slots | UC-08 | GET /api/v1/appointment/available-slots |
| US-017 | Patient | Book an available appointment | UC-09 | POST /api/v1/appointment/book |
| US-018 | Patient | Prevent double booking | UC-09 | POST /api/v1/appointment/book |
| US-019 | Patient | View my appointments | UC-10 | GET /api/v1/appointment/user |
| US-020 | Doctor | View assigned appointments | UC-11 | GET /api/v1/appointment/doctor |
| US-021 | Doctor | Approve or reject pending appointment | UC-12 | PUT /api/v1/appointment/update/:id |
| US-022 | Doctor | Complete an approved appointment | UC-12 | PUT /api/v1/appointment/update/:id |
| US-023 | Patient | Attach a supported medical document | UC-13 | POST /api/v1/appointment/book |
| US-024 | Doctor | Access assigned patient's medical document | UC-13 | GET /api/v1/appointment/:id/medical-document |
| US-025 | Authenticated user | Read and manage notifications | UC-14 | GET /api/v1/notification |

## Individual user stories and acceptance criteria

### US-001 — Register as patient

**Role:** Visitor  
**User story:** As a visitor, I want to register using my name, email, mobile number and password so that I can access patient services.  
**Use case:** UC-01  
**Actual application route:** POST /api/v1/auth/register  
**Source-code trace:** [server/controllers/authController.js](../server/controllers/authController.js)

**Acceptance criteria:**
1. Valid unique details create account and JWT
2. missing fields or short password are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-002 — Sign in securely

**Role:** Visitor  
**User story:** As a visitor, I want to sign in with my registered email and password so that I can access my account.  
**Use case:** UC-02  
**Actual application route:** POST /api/v1/auth/login  
**Source-code trace:** [server/controllers/authController.js](../server/controllers/authController.js)

**Acceptance criteria:**
1. Valid credentials return an authenticated session
2. invalid credentials return no token.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-003 — View my account

**Role:** Authenticated user  
**User story:** As a authenticated user, I want to view my authenticated profile so that I can confirm my identity and role.  
**Use case:** UC-03  
**Actual application route:** GET /api/v1/auth/me  
**Source-code trace:** [server/routes/authRoutes.js](../server/routes/authRoutes.js)

**Acceptance criteria:**
1. Valid JWT returns the current user
2. missing or invalid JWT is rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-004 — Access role-specific dashboards

**Role:** Authenticated user  
**User story:** As an authenticated user, I want the application to show only the navigation and functionality authorized for my role so that patient, doctor, and administrator actions remain appropriately restricted.  
**Use case:** UC-15  
**Actual application route:** UI /  
**Source-code trace:** [client/src/components/ProtectedRoute.jsx](../client/src/components/ProtectedRoute.jsx)

**Acceptance criteria:**
1. Patients cannot access doctor-only or admin-only actions.
2. Doctor and admin API permissions are enforced by backend role middleware.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-005 — Browse approved doctors

**Role:** Visitor  
**User story:** As a visitor, I want to see a list of approved doctors so that I can choose a healthcare specialist.  
**Use case:** UC-04  
**Actual application route:** GET /api/v1/doctor/all  
**Source-code trace:** [server/controllers/doctorController.js](../server/controllers/doctorController.js)

**Acceptance criteria:**
1. Only approved doctors appear
2. an empty list is handled clearly.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-006 — View doctor details

**Role:** Visitor  
**User story:** As a visitor, I want to view an approved doctor's information so that I can decide whether to book.  
**Use case:** UC-04  
**Actual application route:** GET /api/v1/doctor/:id  
**Source-code trace:** [server/routes/doctorRoutes.js](../server/routes/doctorRoutes.js)

**Acceptance criteria:**
1. Valid approved doctor details are returned
2. invalid or unapproved IDs are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-007 — Check public available slots

**Role:** Visitor  
**User story:** As a visitor, I want to check a doctor's remaining future appointment slots before logging in so that I can plan a visit.  
**Use case:** UC-08  
**Actual application route:** GET /api/v1/doctor/available-slots  
**Source-code trace:** [server/routes/doctorRoutes.js](../server/routes/doctorRoutes.js)

**Acceptance criteria:**
1. Public result shows open slots only
2. private booking details are not exposed.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-008 — Apply to become a doctor

**Role:** Patient  
**User story:** As a patient, I want to submit a professional doctor application so that an administrator can review my request.  
**Use case:** UC-05  
**Actual application route:** POST /api/v1/doctor/apply  
**Source-code trace:** [server/controllers/doctorController.js](../server/controllers/doctorController.js)

**Acceptance criteria:**
1. A valid application is stored as pending
2. validation errors are reported.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-009 — Prevent duplicate pending application

**Role:** Patient  
**User story:** As a patient, I want the system to prevent duplicate pending doctor applications so that the review queue stays consistent.  
**Use case:** UC-05  
**Actual application route:** POST /api/v1/doctor/apply  
**Source-code trace:** [server/controllers/doctorController.js](../server/controllers/doctorController.js)

**Acceptance criteria:**
1. A second application while the first is pending is rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-010 — List pending doctor applications

**Role:** Administrator  
**User story:** As a administrator, I want to see pending doctor applications so that I can review requests.  
**Use case:** UC-06  
**Actual application route:** GET /api/v1/admin/doctors/pending  
**Source-code trace:** [server/routes/adminRoutes.js](../server/routes/adminRoutes.js)

**Acceptance criteria:**
1. Admins see pending submissions
2. patients are forbidden.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-011 — Approve a doctor

**Role:** Administrator  
**User story:** As a administrator, I want to approve an eligible pending doctor application so that the doctor can access doctor features.  
**Use case:** UC-06  
**Actual application route:** PUT /api/v1/admin/doctors/approve/:id  
**Source-code trace:** [server/controllers/adminController.js](../server/controllers/adminController.js)

**Acceptance criteria:**
1. Pending record becomes approved and user gets doctor role
2. non-admin cannot approve.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-012 — Reject a doctor application

**Role:** Administrator  
**User story:** As a administrator, I want to reject a pending doctor application so that invalid requests do not receive doctor access.  
**Use case:** UC-06  
**Actual application route:** PUT /api/v1/admin/doctors/reject/:id  
**Source-code trace:** [server/controllers/adminController.js](../server/controllers/adminController.js)

**Acceptance criteria:**
1. Pending application becomes rejected
2. non-admin requests are forbidden.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-013 — Edit professional profile

**Role:** Doctor  
**User story:** As a doctor, I want to update my doctor profile so that patients can view accurate professional details.  
**Use case:** UC-07  
**Actual application route:** PUT /api/v1/doctor/profile  
**Source-code trace:** [server/controllers/doctorController.js](../server/controllers/doctorController.js)

**Acceptance criteria:**
1. Authorized doctor changes valid fields
2. invalid changes are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-014 — Configure weekly working schedule

**Role:** Doctor  
**User story:** As a doctor, I want to configure my weekly sessions and slot duration so that patients book only during working hours.  
**Use case:** UC-07  
**Actual application route:** PUT /api/v1/doctor/profile  
**Source-code trace:** [server/controllers/doctorController.js](../server/controllers/doctorController.js)

**Acceptance criteria:**
1. Valid sessions and supported slot durations save
2. overlapping sessions and unsupported durations are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-015 — Block unavailable dates

**Role:** Doctor  
**User story:** As a doctor, I want to block days when I am unavailable so that no bookable slots appear on those dates.  
**Use case:** UC-07  
**Actual application route:** PUT /api/v1/doctor/profile  
**Source-code trace:** [server/controllers/doctorController.js](../server/controllers/doctorController.js)

**Acceptance criteria:**
1. Valid blocked dates save
2. slot availability excludes blocked days.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-016 — Find authenticated appointment slots

**Role:** Patient  
**User story:** As a patient, I want to view future free slots for an approved doctor so that I can select a valid time.  
**Use case:** UC-08  
**Actual application route:** GET /api/v1/appointment/available-slots  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Available slots respect schedule, existing bookings and date
2. past dates are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-017 — Book an available appointment

**Role:** Patient  
**User story:** As a patient, I want to reserve an open slot with a doctor so that I can receive a pending appointment.  
**Use case:** UC-09  
**Actual application route:** POST /api/v1/appointment/book  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Valid booking creates Pending appointment
2. unavailable times are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-018 — Prevent double booking

**Role:** Patient  
**User story:** As a patient, I want the same doctor slot to be reserved at most once so that two patients cannot hold the identical active slot.  
**Use case:** UC-09  
**Actual application route:** POST /api/v1/appointment/book  
**Source-code trace:** [server/models/Appointment.js](../server/models/Appointment.js)

**Acceptance criteria:**
1. Competing requests produce at most one active booking
2. conflicting attempt is rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-019 — View my appointments

**Role:** Patient  
**User story:** As a patient, I want to view my own booked appointments and their statuses so that I can track visits.  
**Use case:** UC-10  
**Actual application route:** GET /api/v1/appointment/user  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Only my appointments are visible after authentication.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-020 — View assigned appointments

**Role:** Doctor  
**User story:** As a doctor, I want to view only appointments assigned to me so that I can manage my patient schedule.  
**Use case:** UC-11  
**Actual application route:** GET /api/v1/appointment/doctor  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Assigned doctor sees own appointments
2. other doctors' bookings stay private.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-021 — Approve or reject pending appointment

**Role:** Doctor  
**User story:** As a doctor, I want to approve or reject a pending booking so that the patient knows whether it is accepted.  
**Use case:** UC-12  
**Actual application route:** PUT /api/v1/appointment/update/:id  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Pending can transition to Approved or Rejected
2. other doctors cannot change it.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-022 — Complete an approved appointment

**Role:** Doctor  
**User story:** As a doctor, I want to mark an approved appointment completed so that the visit workflow is finalized.  
**Use case:** UC-12  
**Actual application route:** PUT /api/v1/appointment/update/:id  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Only Approved becomes Completed
2. terminal states cannot be reopened.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-023 — Attach a supported medical document

**Role:** Patient  
**User story:** As a patient, I want to attach an optional medical document while booking so that my doctor has relevant context.  
**Use case:** UC-13  
**Actual application route:** POST /api/v1/appointment/book  
**Source-code trace:** [server/middleware/medicalDocumentUpload.js](../server/middleware/medicalDocumentUpload.js)

**Acceptance criteria:**
1. PDF, JPEG or PNG files up to 5 MiB are accepted
2. disallowed formats and excess size are rejected.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-024 — Access assigned patient's medical document

**Role:** Doctor  
**User story:** As a doctor, I want to securely retrieve an attachment for my assigned appointment so that I can review it.  
**Use case:** UC-13  
**Actual application route:** GET /api/v1/appointment/:id/medical-document  
**Source-code trace:** [server/controllers/appointmentController.js](../server/controllers/appointmentController.js)

**Acceptance criteria:**
1. Only the assigned doctor may access an attached file
2. other users cannot.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

### US-025 — Read and manage notifications

**Role:** Authenticated user  
**User story:** As a authenticated user, I want to view my notifications and mark them as read so that I can keep track of appointment updates.  
**Use case:** UC-14  
**Actual application route:** GET /api/v1/notification  
**Source-code trace:** [server/controllers/notificationController.js](../server/controllers/notificationController.js)

**Acceptance criteria:**
1. Only own notifications are returned
2. update routes affect only owned records.

**Planned test-design coverage:** Successful operation; incorrect/invalid input; authorization and applicable boundary/state conditions. Only cases supported by the source implementation will be accepted.

## Traceability and next steps

1. Review each story with the instructor against the deployed application and actual source code.
2. In the independent TestPilot Lab UI, provide the healthcare URL, pick or edit a user story, and fetch the public available application evidence.
3. Use an LLM API from the standalone server to generate structured candidate test cases; do not represent them as executed.
4. Validate route/role/conditions, ask for human review, and map approved cases to the user story ID.
5. In a later milestone, run approved automation in an isolated test environment and show the actual result, error evidence, and run time.

## Practical demo safety

Use only fictional patient accounts and doctors. Do not publish JWTs, passwords, medical records, phone numbers, or private data as model input or test artifacts. Never execute arbitrary model-generated code in the production healthcare server.
