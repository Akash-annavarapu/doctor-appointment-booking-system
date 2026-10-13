# TestPilot — Illustrative Test-Case Matrix (Milestone 2)

**Status: designed from repository code; not an execution-results report.**  
The case IDs, expected responses and endpoints are **test design**. No row is marked PASS/FAIL because these cases have not been run as part of this documentation milestone. Use synthetic test records. Routes shown have prefix `/api/v1`.

| ID | Use case | Class | Scenario / representative input | Expected behavior / API status | Evidence anchor |
|---|---|---|---|---|---|
| TP-001 | UC-01 | Positive | Register with unique email, valid name/password/mobile | Account created; token returned; **201** | `authController.js` |
| TP-002 | UC-01 | Negative | Missing one required registration field | Rejected; **400** | `authController.js` |
| TP-003 | UC-01 | Boundary | Password is 7 characters | Rejected; **400** | `authController.js` |
| TP-004 | UC-01 | Boundary | Valid 8-character password | Accepted when other fields valid; **201** | `authController.js` |
| TP-005 | UC-01 | Negative | Reuse existing email (case normalized) | Duplicate rejected; **409** | `authController.js` |
| TP-006 | UC-01 | Negative | Phone not matching 10-digit Indian mobile pattern | Rejected; **400** | `authController.js` |
| TP-007 | UC-02 | Positive | Correct email and password | Token + user returned; **200**; correct dashboard | `authController.js`; `Login.jsx` |
| TP-008 | UC-02 | Negative | Wrong password | No token; **401** | `authController.js` |
| TP-009 | UC-03 | Security | Fetch `GET /auth/me` without token | Unauthorized; **401** (validate middleware response) | `authRoutes.js`; `authMiddleware.js` |
| TP-010 | UC-15 | Authorization | Patient requests admin doctor-approval route | Forbidden; **403** | `adminRoutes.js`; `roleMiddleware.js` |
| TP-011 | UC-04 | Positive | GET `/doctor/all` with one approved and one pending doctor | **200**; approved is visible, pending hidden | `doctorController.js` |
| TP-012 | UC-04 | Empty data | No approved doctors exist | **200** with empty `doctors` array; UI shows no-approved-doctors state | `FeaturedDoctors.jsx`; `doctorController.js` |
| TP-013 | UC-04 | Negative | GET `/doctor/:id` with invalid MongoDB ObjectId | Validation error (client error) | `doctorRoutes.js`; `validateObjectId.js` |
| TP-014 | UC-05 | Positive | Authenticated patient submits valid doctor application | New application **pending**, **201** | `doctorController.js` |
| TP-015 | UC-05 | State | Submit another application while first pending | Rejected; **400** | `doctorController.js` |
| TP-016 | UC-06 | Positive | Admin approves pending application | **200**; doctor becomes approved, user gains doctor role | `adminController.js` |
| TP-017 | UC-06 | Authorization | Patient attempts doctor approval | Forbidden; **403** | `adminRoutes.js` |
| TP-018 | UC-07 | Boundary | Set appointment slot duration to 10 minutes | Rejected; **400** | `doctorController.js` |
| TP-019 | UC-07 | Positive | Doctor sets valid weekly sessions and 30-minute slots | Profile/schedule updated; **200** | `doctorController.js` |
| TP-020 | UC-08 | Negative | Request slots for a past date | Rejected; **400** | `appointmentController.js` |
| TP-021 | UC-08 | Boundary/state | Request a configured blocked date | **200**; no available slots | `appointmentController.js` |
| TP-022 | UC-08 | State | Doctor disabled on requested weekday | **200**; zero slots | `appointmentController.js` |
| TP-023 | UC-09 | Positive | Patient books a valid future free slot | Appointment **Pending**; **201** | `appointmentController.js`; `Appointment.js` |
| TP-024 | UC-09 | Negative | Book time outside doctor's working sessions | Rejected; **400** | `appointmentController.js` |
| TP-025 | UC-09 | Concurrency | Two patients race for same doctor/date/time | Exactly one active booking; loser receives conflict **409** | `Appointment.js` unique index; `appointmentController.js` |
| TP-026 | UC-09 | Negative | Book an already occupied active slot | Rejected; **409** | `appointmentController.js` |
| TP-027 | UC-13 | Validation | Upload unsupported file MIME type | Rejected; **400** | `medicalDocumentUpload.js` |
| TP-028 | UC-13 | Boundary | Upload file exceeding 5 MiB | Upload rejected (assert actual middleware code + cleanup) | `medicalDocumentUpload.js` |
| TP-029 | UC-10 | Authorization | Patient A fetches `GET /appointment/user` | Only patient A's appointments returned; **200** | `appointmentController.js` |
| TP-030 | UC-11 | Authorization | Doctor A fetches `GET /appointment/doctor` | Only assigned appointments; **200** | `appointmentController.js` |
| TP-031 | UC-12 | Positive | Doctor changes **Pending → Approved** | Updated; **200** | `appointmentController.js` |
| TP-032 | UC-12 | State | Doctor attempts **Completed → Pending** | Transition rejected; **409** | `appointmentController.js` |
| TP-033 | UC-12 | Authorization | Doctor B tries changing Doctor A's appointment | Not found/unauthorized; **404** | `appointmentController.js` |
| TP-034 | UC-13 | Security | Doctor B requests Doctor A appointment's medical file | Not found/unauthorized; **404** | `appointmentController.js` |
| TP-035 | UC-14 | Positive | User fetches own notifications | **200**, unread count and own list | `notificationController.js` |
| TP-036 | UC-14 | Security | User A attempts to mark User B notification read | Not found; **404** | `notificationController.js` |

## Example full test specification

**TP-025 — Concurrent active appointment booking**

- **Trace:** UC-09; `server/models/Appointment.js` `unique_active_doctor_slot`; `server/controllers/appointmentController.js`.
- **Preconditions:** Approved doctor with a valid future 30-minute slot; two distinct synthetic patient accounts; same date/time; no existing active appointment in the slot.
- **Steps:** Each patient authenticates independently; submit two `POST /appointment/book` requests targeting exactly the same slot as close together as practical.
- **Expected:** At most one **Pending/Approved** appointment occupies that doctor/date/time; one request succeeds (**201**); the other receives **409**; the slot is not offered as free afterward.
- **Cleanup:** Remove or reset only approved synthetic test records in the designated test environment. Avoid running concurrency tests against real patient bookings.
- **Caveat:** Actual concurrency behavior must be validated by executing the test with the DB unique index present. This is a designed test, not a claim of execution.

## Priority and coverage plan

- **P0:** TP-001, 007–010, 016–017, 023–025, 031–034 (identity, roles, booking integrity, document privacy).
- **P1:** Registration boundaries/duplicates, approved filtering, availability, status transitions, upload restrictions.
- **P2:** Empty states, interface messaging and optional notification interactions.

Covered categories: positive, negative, boundary, authorization, state transition, empty data, concurrency and file validation. Future implementation should record test run ID, timestamp, fixture set, environment, **actual** outcome and evidence separately from this design matrix.
