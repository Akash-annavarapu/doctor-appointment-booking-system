const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");


// ======================================
// Constants
// ======================================
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ACTIVE_STATUSES = [
  "Pending",
  "Approved",
];


// ======================================
// Normalize Time to HH:mm
//
// Supports:
// 09:00
// 17:00
// 09:00 AM
// 05:00 PM
// ======================================
const normalizeTime = (timeString) => {
  if (
    !timeString ||
    typeof timeString !== "string"
  ) {
    return null;
  }

  const value = timeString.trim();

  const twentyFourHourMatch =
    value.match(
      /^([01]\d|2[0-3]):([0-5]\d)$/
    );

  if (twentyFourHourMatch) {
    return `${twentyFourHourMatch[1]}:${twentyFourHourMatch[2]}`;
  }

  const twelveHourMatch =
    value.match(
      /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i
    );

  if (!twelveHourMatch) {
    return null;
  }

  let hour = Number(
    twelveHourMatch[1]
  );

  const minute =
    twelveHourMatch[2];

  const period =
    twelveHourMatch[3].toUpperCase();

  if (hour < 1 || hour > 12) {
    return null;
  }

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  return `${String(hour).padStart(
    2,
    "0"
  )}:${minute}`;
};


// ======================================
// Convert HH:mm to total minutes
// ======================================
const timeToMinutes = (time) => {
  const normalized =
    normalizeTime(time);

  if (!normalized) {
    return null;
  }

  const [hour, minute] =
    normalized
      .split(":")
      .map(Number);

  return hour * 60 + minute;
};


// ======================================
// Convert total minutes to HH:mm
// ======================================
const minutesToTime = (
  totalMinutes
) => {
  const hour = Math.floor(
    totalMinutes / 60
  );

  const minute =
    totalMinutes % 60;

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(
    2,
    "0"
  )}`;
};


// ======================================
// Validate YYYY-MM-DD
// ======================================
const parseAppointmentDate = (
  appointmentDate
) => {
  if (
    !appointmentDate ||
    typeof appointmentDate !== "string"
  ) {
    return null;
  }

  const match =
    appointmentDate.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    date,
  };
};


// ======================================
// Get local YYYY-MM-DD
// ======================================
const getLocalDateString = (
  date
) => {
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


// ======================================
// Generate slots from one session
//
// Example:
// 09:00 -> 11:00
// duration 30
//
// Result:
// 09:00
// 09:30
// 10:00
// 10:30
// ======================================
const generateSessionSlots = (
  startTime,
  endTime,
  slotDuration
) => {
  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes >= endMinutes
  ) {
    return [];
  }

  const slots = [];

  for (
    let current = startMinutes;
    current + slotDuration <=
      endMinutes;
    current += slotDuration
  ) {
    slots.push(
      minutesToTime(current)
    );
  }

  return slots;
};


// ======================================
// Generate doctor's scheduled slots
// for a selected date
// ======================================
const generateDoctorSlotsForDate = (
  doctor,
  appointmentDate
) => {
  const parsedDate =
    parseAppointmentDate(
      appointmentDate
    );

  if (!parsedDate) {
    return {
      valid: false,
      message:
        "Invalid appointment date.",
      slots: [],
      dayName: null,
    };
  }

  const selectedDate =
    parsedDate.date;

  selectedDate.setHours(
    0,
    0,
    0,
    0
  );

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  if (selectedDate < today) {
    return {
      valid: false,
      message:
        "Appointment date cannot be in the past.",
      slots: [],
      dayName: null,
    };
  }

  if (
    Array.isArray(
      doctor.blockedDates
    ) &&
    doctor.blockedDates.includes(
      appointmentDate
    )
  ) {
    return {
      valid: true,
      message:
        "Doctor is unavailable on this date.",
      slots: [],
      dayName:
        DAY_NAMES[
          selectedDate.getDay()
        ],
      blocked: true,
    };
  }

  const dayName =
    DAY_NAMES[
      selectedDate.getDay()
    ];

  const dayAvailability =
    (
      doctor.weeklyAvailability ||
      []
    ).find(
      (item) =>
        item.day === dayName
    );

  if (
    !dayAvailability ||
    !dayAvailability.enabled ||
    !Array.isArray(
      dayAvailability.sessions
    ) ||
    dayAvailability.sessions.length ===
      0
  ) {
    return {
      valid: true,
      message:
        `Doctor is not available on ${dayName}.`,
      slots: [],
      dayName,
      blocked: false,
    };
  }

  const slotDuration =
    Number(
      doctor.slotDuration
    );

  if (
    ![15, 20, 30, 45, 60].includes(
      slotDuration
    )
  ) {
    return {
      valid: false,
      message:
        "Doctor has an invalid slot duration configuration.",
      slots: [],
      dayName,
    };
  }

  const generatedSlots = [];

  for (
    const session of
    dayAvailability.sessions
  ) {
    const sessionSlots =
      generateSessionSlots(
        session.startTime,
        session.endTime,
        slotDuration
      );

    generatedSlots.push(
      ...sessionSlots
    );
  }

  const uniqueSlots = [
    ...new Set(generatedSlots),
  ].sort();

  return {
    valid: true,
    message:
      uniqueSlots.length > 0
        ? "Schedule generated successfully."
        : `Doctor is not available on ${dayName}.`,
    slots: uniqueSlots,
    dayName,
    blocked: false,
  };
};


// ======================================
// Remove booked and past slots
// ======================================
const getAvailableSlots = async (
  doctor,
  appointmentDate
) => {
  const scheduleResult =
    generateDoctorSlotsForDate(
      doctor,
      appointmentDate
    );

  if (!scheduleResult.valid) {
    return scheduleResult;
  }

  if (
    scheduleResult.slots.length === 0
  ) {
    return {
      ...scheduleResult,
      bookedSlots: [],
      availableSlots: [],
    };
  }

  const bookedAppointments =
    await Appointment.find({
      doctorId: doctor._id,
      appointmentDate,
      status: {
        $in: ACTIVE_STATUSES,
      },
    }).select("appointmentTime");

  const bookedSlots = [
    ...new Set(
      bookedAppointments
        .map((appointment) =>
          normalizeTime(
            appointment.appointmentTime
          )
        )
        .filter(Boolean)
    ),
  ];

  const now = new Date();

  const todayString =
    getLocalDateString(now);

  const availableSlots =
    scheduleResult.slots.filter(
      (slot) => {
        if (
          bookedSlots.includes(slot)
        ) {
          return false;
        }

        if (
          appointmentDate !==
          todayString
        ) {
          return true;
        }

        const [hour, minute] =
          slot
            .split(":")
            .map(Number);

        const slotDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hour,
          minute,
          0,
          0
        );

        return slotDate > now;
      }
    );

  return {
    ...scheduleResult,
    bookedSlots,
    availableSlots,
  };
};


// ======================================
// Get Available Slots Controller
// ======================================
const getAvailableSlotsController =
  async (req, res) => {
    try {
      const {
        doctorId,
        appointmentDate,
      } = req.query;

      if (
        !doctorId ||
        !appointmentDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Doctor and appointment date are required.",
        });
      }

      if (
        !mongoose.isObjectIdOrHexString(
          doctorId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid doctor ID.",
        });
      }

      const doctor =
        await Doctor.findById(
          doctorId
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            "Doctor not found.",
        });
      }

      if (
        doctor.status !== "approved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Doctor is not currently available for booking.",
        });
      }

      const result =
        await getAvailableSlots(
          doctor,
          appointmentDate
        );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(200).json({
        success: true,

        message: result.message,

        dayName:
          result.dayName,

        blocked:
          Boolean(result.blocked),

        slotDuration:
          doctor.slotDuration,

        doctorSlots:
          result.slots,

        bookedSlots:
          result.bookedSlots ||
          [],

        availableSlots:
          result.availableSlots ||
          [],
      });
    } catch (error) {
      console.error(
        "Get available slots error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch available slots.",
      });
    }
  };


// ======================================
// Book Appointment Controller
// ======================================
const bookAppointmentController =
  async (req, res) => {
    let retainUploadedDocument = false;

    try {
      const {
        doctorId,
        appointmentDate,
        appointmentTime,
      } = req.body;

      const medicalDocument =
        req.file
          ? req.file.filename
          : "";

      if (
        !doctorId ||
        !appointmentDate ||
        !appointmentTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Doctor, date and time are required.",
        });
      }

      const parsedDate =
        parseAppointmentDate(
          appointmentDate
        );

      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid appointment date.",
        });
      }

      const normalizedAppointmentTime =
        normalizeTime(
          appointmentTime
        );

      if (
        !normalizedAppointmentTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid appointment time.",
        });
      }

      if (
        !mongoose.isObjectIdOrHexString(
          doctorId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid doctor ID.",
        });
      }

      const doctor =
        await Doctor.findById(
          doctorId
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            "Doctor not found.",
        });
      }

      if (
        doctor.status !== "approved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This doctor is not available for booking.",
        });
      }

      const result =
        await getAvailableSlots(
          doctor,
          appointmentDate
        );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      if (
        !result.slots.includes(
          normalizedAppointmentTime
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected time is outside the doctor's working schedule.",
        });
      }

      if (
        !result.availableSlots.includes(
          normalizedAppointmentTime
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This time slot is no longer available. Please select another slot.",
        });
      }

      const appointment =
        await Appointment.create({
          doctorId,

          userId:
            req.user._id,

          appointmentDate,

          appointmentTime:
            normalizedAppointmentTime,

          medicalDocument:
            medicalDocument || "",

          status: "Pending",
        });

      retainUploadedDocument = true;

      // Notify the doctor account about the new booking.
      // Notification failure must not roll back a successful booking.
      try {
        await Notification.create({
          userId: doctor.userId,
          message:
            `New appointment booked for ${appointmentDate} at ${normalizedAppointmentTime}.`,
        });
      } catch (notificationError) {
        console.error(
          "Appointment booking notification error:",
          notificationError
        );
      }


      return res.status(201).json({
        success: true,

        message:
          "Appointment booked successfully.",

        appointment,
      });
    } catch (error) {
      // ==================================
      // Database-Level Double Booking Guard
      // ==================================
      if (
        error?.code === 11000 &&
        error?.keyPattern?.doctorId &&
        error?.keyPattern?.appointmentDate &&
        error?.keyPattern?.appointmentTime
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This time slot was just booked by another patient. Please select another available time.",
        });
      }


      console.error(
        "Book appointment error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          "Failed to book appointment.",
      });
    } finally {
      if (
        req.file?.path &&
        !retainUploadedDocument
      ) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          if (
            cleanupError.code !== "ENOENT"
          ) {
            console.error(
              "Medical document cleanup error:",
              cleanupError
            );
          }
        }
      }
    }
  };

const getUserAppointmentsController =
  async (req, res) => {
    try {
      const appointments =
        await Appointment.find({
          userId: req.user._id,
        })
          .populate(
            "doctorId",
            [
              "fullName",
              "email",
              "specialization",
              "experience",
              "fees",
              "address",
              "weeklyAvailability",
              "slotDuration",
            ].join(" ")
          )
          .sort({
            appointmentDate: -1,
            appointmentTime: -1,
          });


      return res.status(200).json({
        success: true,
        total: appointments.length,
        appointments,
      });

    } catch (error) {
      console.error(
        "Get user appointments error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch user appointments.",
      });
    }
  };


// ======================================
// Get Doctor Appointments
// ======================================
const getDoctorAppointmentsController =
  async (req, res) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId: req.user._id,
          status: "approved",
        });


      if (!doctor) {
        return res.status(403).json({
          success: false,
          message:
            "Approved doctor profile not found.",
        });
      }


      const appointments =
        await Appointment.find({
          doctorId: doctor._id,
        })
          .populate(
            "userId",
            [
              "name",
              "email",
              "phone",
            ].join(" ")
          )
          .sort({
            appointmentDate: 1,
            appointmentTime: 1,
          });


      return res.status(200).json({
        success: true,
        total: appointments.length,
        appointments,
      });

    } catch (error) {
      console.error(
        "Get doctor appointments error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch doctor appointments.",
      });
    }
  };


// ======================================
// Update Appointment Status
// ======================================
const updateAppointmentStatusController =
  async (req, res) => {
    try {
      const { status } = req.body;


      // ==================================
      // Allowed Status Transition Map
      //
      // Pending:
      //   -> Approved
      //   -> Rejected
      //
      // Approved:
      //   -> Completed
      //
      // Rejected and Completed:
      //   terminal states
      // ==================================
      const allowedTransitions = {
        Pending: [
          "Approved",
          "Rejected",
        ],

        Approved: [
          "Completed",
        ],

        Rejected: [],

        Completed: [],
      };


      if (
        !Object.prototype.hasOwnProperty.call(
          allowedTransitions,
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid appointment status.",
        });
      }


      const doctor =
        await Doctor.findOne({
          userId: req.user._id,
          status: "approved",
        });


      if (!doctor) {
        return res.status(403).json({
          success: false,
          message:
            "Approved doctor profile not found.",
        });
      }


      const appointment =
        await Appointment.findOne({
          _id: req.params.id,
          doctorId: doctor._id,
        });


      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found or unauthorized.",
        });
      }


      const currentStatus =
        appointment.status;

      const nextStatuses =
        allowedTransitions[
          currentStatus
        ];


      if (!nextStatuses) {
        return res.status(409).json({
          success: false,
          message:
            `Appointment has an invalid current status: ${currentStatus}.`,
        });
      }


      if (
        !nextStatuses.includes(status)
      ) {
        return res.status(409).json({
          success: false,
          message:
            `Cannot change appointment status from ${currentStatus} to ${status}.`,
        });
      }


      appointment.status = status;

      await appointment.save();


      // Notify the patient about the appointment status change.
      // Notification failure must not undo a successful status update.
      try {
        await Notification.create({
          userId: appointment.userId,
          message:
            `Your appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime} is now ${status}.`,
        });
      } catch (notificationError) {
        console.error(
          "Appointment status notification error:",
          notificationError
        );
      }


      return res.status(200).json({
        success: true,
        message:
          `Appointment status changed from ${currentStatus} to ${status}.`,
        appointment,
      });

    } catch (error) {
      console.error(
        "Update appointment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update appointment status.",
      });
    }
  };



// ======================================
// Get Appointment Medical Document
// ======================================
const getMedicalDocumentController =
  async (req, res) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId: req.user._id,
          status: "approved",
        });

      if (!doctor) {
        return res.status(403).json({
          success: false,
          message:
            "Approved doctor profile not found.",
        });
      }

      const appointment =
        await Appointment.findOne({
          _id: req.params.id,
          doctorId: doctor._id,
        });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found or unauthorized.",
        });
      }

      if (!appointment.medicalDocument) {
        return res.status(404).json({
          success: false,
          message:
            "No medical document is attached to this appointment.",
        });
      }

      const uploadDirectory = path.resolve(
        __dirname,
        "..",
        "uploads",
        "medical-documents"
      );

      const documentPath = path.resolve(
        uploadDirectory,
        appointment.medicalDocument
      );

      if (
        path.dirname(documentPath) !==
        uploadDirectory
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid medical document path.",
        });
      }

      try {
        await fs.access(documentPath);
      } catch (error) {
        if (error.code === "ENOENT") {
          return res.status(404).json({
            success: false,
            message:
              "Medical document file not found.",
          });
        }

        throw error;
      }

      return res.sendFile(documentPath);

    } catch (error) {
      console.error(
        "Get medical document error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to retrieve medical document.",
      });
    }
  };


// Public read-only availability: never expose booked appointment details.
const getPublicAvailableSlotsController = async (req, res) => {
  try {
    const { doctorId, appointmentDate } = req.query;

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Doctor and appointment date are required.",
      });
    }

    if (!mongoose.isObjectIdOrHexString(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID." });
    }

    const doctor = await Doctor.findOne({ _id: doctorId, status: "approved" });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    const result = await getAvailableSlots(doctor, appointmentDate);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      dayName: result.dayName,
      blocked: Boolean(result.blocked),
      slotDuration: doctor.slotDuration,
      availableSlots: result.availableSlots || [],
    });
  } catch (error) {
    console.error("Public availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available slots.",
    });
  }
};


// ======================================
// Exports
// ======================================
module.exports = {
  getPublicAvailableSlotsController,
  getAvailableSlotsController,
  bookAppointmentController,
  getUserAppointmentsController,
  getDoctorAppointmentsController,
  updateAppointmentStatusController,
  getMedicalDocumentController,
};
