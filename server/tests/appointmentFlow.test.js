const request = require("supertest");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");

const app = require("../app");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require(
  "../models/Appointment"
);
const Notification = require(
  "../models/Notification"
);
const generateToken = require(
  "../utils/generateToken"
);

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "medical-documents"
);


// ======================================
// Binary Response Helper
// ======================================
const binaryParser = (
  response,
  callback
) => {
  const chunks = [];

  response.on(
    "data",
    (chunk) => {
      chunks.push(chunk);
    }
  );

  response.on(
    "end",
    () => {
      callback(
        null,
        Buffer.concat(chunks)
      );
    }
  );
};


// ======================================
// Date Helpers
// ======================================
const toDateString = (date) => {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
};


const getFutureDay = (
  targetDay,
  weeksAhead = 2
) => {
  const date = new Date();

  date.setHours(
    12,
    0,
    0,
    0
  );

  const daysUntilTarget =
    (
      targetDay -
      date.getDay() +
      7
    ) % 7;

  date.setDate(
    date.getDate() +
    daysUntilTarget +
    weeksAhead * 7
  );

  return toDateString(date);
};


// ======================================
// Appointment Flow Integration Tests
// ======================================
describe(
  "Appointment Flow API",
  () => {
    let patient;
    let secondPatient;
    let doctorUser;
    let otherDoctorUser;

    let doctor;
    let otherDoctor;

    let patientToken;
    let secondPatientToken;
    let doctorToken;
    let otherDoctorToken;

    let mondayDate;
    let tuesdayDate;
    let blockedMondayDate;


    beforeEach(async () => {
      await Notification.deleteMany({});
      await Appointment.deleteMany({});
      await Doctor.deleteMany({});
      await User.deleteMany({});

      const uploadedFiles =
        await fs.readdir(uploadDirectory);

      await Promise.all(
        uploadedFiles
          .filter(
            (fileName) =>
              fileName !== ".gitkeep"
          )
          .map((fileName) =>
            fs.unlink(
              path.join(
                uploadDirectory,
                fileName
              )
            )
          )
      );


      mondayDate =
        getFutureDay(1, 2);

      tuesdayDate =
        getFutureDay(2, 2);

      blockedMondayDate =
        getFutureDay(1, 3);


      const password =
        await bcrypt.hash(
          "password123",
          10
        );


      patient =
        await User.create({
          name: "Patient One",
          email:
            "patient1@example.com",
          password,
          phone: "9876543210",
        });


      secondPatient =
        await User.create({
          name: "Patient Two",
          email:
            "patient2@example.com",
          password,
          phone: "9876543211",
        });


      doctorUser =
        await User.create({
          name: "Doctor User",
          email:
            "doctor1@example.com",
          password,
          phone: "9876543212",
          isDoctor: true,
        });


      otherDoctorUser =
        await User.create({
          name: "Other Doctor",
          email:
            "doctor2@example.com",
          password,
          phone: "9876543213",
          isDoctor: true,
        });


      doctor =
        await Doctor.create({
          userId:
            doctorUser._id,

          fullName:
            "Dr Appointment Test",

          phone:
            "9876543212",

          email:
            "doctor1@example.com",

          specialization:
            "General Medicine",

          experience:
            "5 years",

          fees: 500,

          address:
            "Test Address",

          weeklyAvailability: [
            {
              day: "Monday",
              enabled: true,
              sessions: [
                {
                  startTime:
                    "09:00",
                  endTime:
                    "11:00",
                },
              ],
            },
          ],

          slotDuration: 30,

          blockedDates: [
            blockedMondayDate,
          ],

          status: "approved",
        });


      otherDoctor =
        await Doctor.create({
          userId:
            otherDoctorUser._id,

          fullName:
            "Dr Other Doctor",

          phone:
            "9876543213",

          email:
            "doctor2@example.com",

          specialization:
            "Cardiology",

          experience:
            "7 years",

          fees: 700,

          address:
            "Other Address",

          weeklyAvailability: [
            {
              day: "Monday",
              enabled: true,
              sessions: [
                {
                  startTime:
                    "09:00",
                  endTime:
                    "11:00",
                },
              ],
            },
          ],

          slotDuration: 30,

          status: "approved",
        });


      patientToken =
        generateToken(
          patient._id
        );

      secondPatientToken =
        generateToken(
          secondPatient._id
        );

      doctorToken =
        generateToken(
          doctorUser._id
        );

      otherDoctorToken =
        generateToken(
          otherDoctorUser._id
        );
    });


    // ==================================
    // Available Slots
    // ==================================
    test(
      "returns generated slots for an available day",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/v1/appointment/available-slots"
            )
            .query({
              doctorId:
                doctor._id.toString(),

              appointmentDate:
                mondayDate,
            })
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            );


        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.dayName
        ).toBe("Monday");

        expect(
          response.body.doctorSlots
        ).toEqual([
          "09:00",
          "09:30",
          "10:00",
          "10:30",
        ]);

        expect(
          response.body.availableSlots
        ).toEqual([
          "09:00",
          "09:30",
          "10:00",
          "10:30",
        ]);
      }
    );


    test(
      "returns no slots on an unavailable day",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/v1/appointment/available-slots"
            )
            .query({
              doctorId:
                doctor._id.toString(),

              appointmentDate:
                tuesdayDate,
            })
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            );


        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.availableSlots
        ).toEqual([]);
      }
    );


    test(
      "TP-021: returns no slots on a blocked date",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/v1/appointment/available-slots"
            )
            .query({
              doctorId:
                doctor._id.toString(),

              appointmentDate:
                blockedMondayDate,
            })
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            );


        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.blocked
        ).toBe(true);

        expect(
          response.body.availableSlots
        ).toEqual([]);
      }
    );


    test(
      "rejects an invalid doctor ID when fetching slots",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/v1/appointment/available-slots"
            )
            .query({
              doctorId: "bad-id",
              appointmentDate:
                mondayDate,
            })
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            );


        expect(
          response.status
        ).toBe(400);

        expect(
          response.body
        ).toEqual({
          success: false,
          message:
            "Invalid doctor ID.",
        });
      }
    );


    // ==================================
    // Booking
    // ==================================
    test(
      "TP-023: books a valid available appointment",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .send({
              doctorId:
                doctor._id.toString(),

              appointmentDate:
                mondayDate,

              appointmentTime:
                "09:00",
            });


        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.appointment
            .appointmentTime
        ).toBe("09:00");

        expect(
          response.body.appointment.status
        ).toBe("Pending");


        const savedAppointment =
          await Appointment.findOne({
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          });


        expect(
          savedAppointment
        ).not.toBeNull();


        const doctorNotification =
          await Notification.findOne({
            userId: doctorUser._id,
          });


        expect(
          doctorNotification
        ).not.toBeNull();

        expect(
          doctorNotification.message
        ).toContain(
          `New appointment booked for ${mondayDate} at 09:00.`
        );
      }
    );


    test(
      "normalizes 12-hour appointment time during booking",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .send({
              doctorId:
                doctor._id.toString(),

              appointmentDate:
                mondayDate,

              appointmentTime:
                "09:30 AM",
            });


        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.appointment
            .appointmentTime
        ).toBe("09:30");
      }
    );


    test(
      "TP-024: rejects booking outside the doctor schedule",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .send({
              doctorId:
                doctor._id.toString(),

              appointmentDate:
                mondayDate,

              appointmentTime:
                "15:00",
            });


        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.message
        ).toBe(
          "Selected time is outside the doctor's working schedule."
        );
      }
    );


    test(
      "TP-026: rejects booking an already occupied slot",
      async () => {
        const bookingData = {
          doctorId:
            doctor._id.toString(),

          appointmentDate:
            mondayDate,

          appointmentTime:
            "10:00",
        };


        const firstResponse =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .send(bookingData);


        expect(
          firstResponse.status
        ).toBe(201);


        const secondResponse =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${secondPatientToken}`
            )
            .send(bookingData);


        expect(
          secondResponse.status
        ).toBe(409);

        expect(
          secondResponse.body.success
        ).toBe(false);
      }
    );


    test(
      "TP-025: prevents concurrent double booking of the same slot",
      async () => {
        const bookingData = {
          doctorId:
            doctor._id.toString(),

          appointmentDate:
            mondayDate,

          appointmentTime:
            "10:30",
        };


        const [
          firstResponse,
          secondResponse,
        ] = await Promise.all([
          request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .send(bookingData),

          request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${secondPatientToken}`
            )
            .send(bookingData),
        ]);


        const statuses = [
          firstResponse.status,
          secondResponse.status,
        ].sort(
          (a, b) => a - b
        );


        expect(
          statuses
        ).toEqual([
          201,
          409,
        ]);


        const appointments =
          await Appointment.find({
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "10:30",
            status: {
              $in: [
                "Pending",
                "Approved",
              ],
            },
          });


        expect(
          appointments
        ).toHaveLength(1);
      }
    );


    test(
      "rejects an invalid doctor ID during booking",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .send({
              doctorId: "bad-id",
              appointmentDate:
                mondayDate,
              appointmentTime:
                "09:00",
            });


        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.message
        ).toBe(
          "Invalid doctor ID."
        );
      }
    );


    // ==================================
    // Appointment Access
    // ==================================
    test(
      "TP-029: returns only the logged-in patient's appointments",
      async () => {
        await Appointment.create([
          {
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          },
          {
            userId:
              secondPatient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:30",
          },
        ]);


        const response =
          await request(app)
            .get(
              "/api/v1/appointment/user"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            );


        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.total
        ).toBe(1);

        expect(
          response.body.appointments
        ).toHaveLength(1);


        const returnedAppointment =
          response.body.appointments[0];


        expect(
          returnedAppointment.userId
        ).toBe(
          patient._id.toString()
        );


        expect(
          returnedAppointment.doctorId
        ).toMatchObject({
          fullName:
            "Dr Appointment Test",
          email:
            "doctor1@example.com",
          specialization:
            "General Medicine",
          experience:
            "5 years",
          fees: 500,
          address:
            "Test Address",
        });
      }
    );


    test(
      "TP-030: returns only appointments belonging to the logged-in doctor",
      async () => {
        await Appointment.create([
          {
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          },
          {
            userId:
              secondPatient._id,
            doctorId:
              otherDoctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          },
        ]);


        const response =
          await request(app)
            .get(
              "/api/v1/appointment/doctor"
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            );


        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.total
        ).toBe(1);

        expect(
          response.body.appointments
        ).toHaveLength(1);
      }
    );


    // ==================================
    // Status Transitions
    // ==================================
    test(
      "TP-031: allows Pending to Approved and Approved to Completed",
      async () => {
        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          });


        const approveResponse =
          await request(app)
            .put(
              `/api/v1/appointment/update/${appointment._id}`
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            )
            .send({
              status: "Approved",
            });


        expect(
          approveResponse.status
        ).toBe(200);

        expect(
          approveResponse.body
            .appointment.status
        ).toBe("Approved");


        const completeResponse =
          await request(app)
            .put(
              `/api/v1/appointment/update/${appointment._id}`
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            )
            .send({
              status: "Completed",
            });


        expect(
          completeResponse.status
        ).toBe(200);

        expect(
          completeResponse.body
            .appointment.status
        ).toBe("Completed");
      }
    );


    test(
      "rejects an invalid appointment status transition",
      async () => {
        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          });


        const response =
          await request(app)
            .put(
              `/api/v1/appointment/update/${appointment._id}`
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            )
            .send({
              status: "Completed",
            });


        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.message
        ).toBe(
          "Cannot change appointment status from Pending to Completed."
        );
      }
    );


    test(
      "TP-033: prevents another doctor from updating an appointment",
      async () => {
        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          });


        const response =
          await request(app)
            .put(
              `/api/v1/appointment/update/${appointment._id}`
            )
            .set(
              "Authorization",
              `Bearer ${otherDoctorToken}`
            )
            .send({
              status: "Approved",
            });


        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.message
        ).toBe(
          "Appointment not found or unauthorized."
        );
      }
    );

    test(
      "uploads a PDF medical document during booking",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .field(
              "doctorId",
              doctor._id.toString()
            )
            .field(
              "appointmentDate",
              mondayDate
            )
            .field(
              "appointmentTime",
              "09:00"
            )
            .attach(
              "medicalDocument",
              Buffer.from(
                "%PDF-1.4 test medical document"
              ),
              {
                filename:
                  "medical-report.pdf",
                contentType:
                  "application/pdf",
              }
            );

        expect(response.status).toBe(201);

        expect(
          response.body.appointment
            .medicalDocument
        ).toMatch(/^[a-f0-9]{48}\.pdf$/);

        const storedPath = path.join(
          uploadDirectory,
          response.body.appointment
            .medicalDocument
        );

        await expect(
          fs.access(storedPath)
        ).resolves.toBeUndefined();
      }
    );

    test(
      "TP-027: rejects unsupported medical document types",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .field(
              "doctorId",
              doctor._id.toString()
            )
            .field(
              "appointmentDate",
              mondayDate
            )
            .field(
              "appointmentTime",
              "09:00"
            )
            .attach(
              "medicalDocument",
              Buffer.from(
                "plain text document"
              ),
              {
                filename: "report.txt",
                contentType: "text/plain",
              }
            );

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
          "Only PDF, JPEG and PNG medical documents are allowed."
        );

        const files =
          await fs.readdir(uploadDirectory);

        expect(
          files.filter(
            (fileName) =>
              fileName !== ".gitkeep"
          )
        ).toHaveLength(0);
      }
    );

    test(
      "TP-028: rejects medical documents larger than 5 MB",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .field(
              "doctorId",
              doctor._id.toString()
            )
            .field(
              "appointmentDate",
              mondayDate
            )
            .field(
              "appointmentTime",
              "09:00"
            )
            .attach(
              "medicalDocument",
              Buffer.alloc(
                5 * 1024 * 1024 + 1
              ),
              {
                filename:
                  "large-report.pdf",
                contentType:
                  "application/pdf",
              }
            );

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
          "Medical document must not exceed 5 MB."
        );
      }
    );

    test(
      "removes uploaded document when booking validation fails",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/v1/appointment/book"
            )
            .set(
              "Authorization",
              `Bearer ${patientToken}`
            )
            .field(
              "doctorId",
              "invalid-doctor-id"
            )
            .field(
              "appointmentDate",
              mondayDate
            )
            .field(
              "appointmentTime",
              "09:00"
            )
            .attach(
              "medicalDocument",
              Buffer.from(
                "%PDF-1.4 orphan cleanup test"
              ),
              {
                filename:
                  "cleanup-test.pdf",
                contentType:
                  "application/pdf",
              }
            );

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
          "Invalid doctor ID."
        );

        const files =
          await fs.readdir(uploadDirectory);

        expect(
          files.filter(
            (fileName) =>
              fileName !== ".gitkeep"
          )
        ).toHaveLength(0);
      }
    );


    test(
      "allows the assigned doctor to access a medical document",
      async () => {
        const fileName =
          "authorized-document.pdf";

        const fileContent =
          Buffer.from(
            "%PDF-1.4 authorized medical document"
          );

        await fs.writeFile(
          path.join(
            uploadDirectory,
            fileName
          ),
          fileContent
        );

        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
            medicalDocument:
              fileName,
          });

        const response =
          await request(app)
            .get(
              `/api/v1/appointment/${appointment._id}/medical-document`
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            )
            .buffer(true)
            .parse(binaryParser);

        expect(response.status).toBe(200);

        expect(
          response.headers[
            "content-type"
          ]
        ).toContain(
          "application/pdf"
        );

        expect(
          Buffer.isBuffer(response.body)
        ).toBe(true);

        expect(
          response.body.equals(
            fileContent
          )
        ).toBe(true);
      }
    );


    test(
      "TP-034: prevents another doctor from accessing a medical document",
      async () => {
        const fileName =
          "private-document.pdf";

        await fs.writeFile(
          path.join(
            uploadDirectory,
            fileName
          ),
          Buffer.from(
            "%PDF-1.4 private medical document"
          )
        );

        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
            medicalDocument:
              fileName,
          });

        const response =
          await request(app)
            .get(
              `/api/v1/appointment/${appointment._id}/medical-document`
            )
            .set(
              "Authorization",
              `Bearer ${otherDoctorToken}`
            );

        expect(response.status).toBe(404);

        expect(response.body.message).toBe(
          "Appointment not found or unauthorized."
        );
      }
    );


    test(
      "returns 404 when an appointment has no medical document",
      async () => {
        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
          });

        const response =
          await request(app)
            .get(
              `/api/v1/appointment/${appointment._id}/medical-document`
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            );

        expect(response.status).toBe(404);

        expect(response.body.message).toBe(
          "No medical document is attached to this appointment."
        );
      }
    );


    test(
      "returns 404 when the medical document file is missing",
      async () => {
        const appointment =
          await Appointment.create({
            userId: patient._id,
            doctorId: doctor._id,
            appointmentDate:
              mondayDate,
            appointmentTime:
              "09:00",
            medicalDocument:
              "missing-document.pdf",
          });

        const response =
          await request(app)
            .get(
              `/api/v1/appointment/${appointment._id}/medical-document`
            )
            .set(
              "Authorization",
              `Bearer ${doctorToken}`
            );

        expect(response.status).toBe(404);

        expect(response.body.message).toBe(
          "Medical document file not found."
        );
      }
    );


  }
);
