const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Notification = require("../models/Notification");


// ======================================
// Constants
// ======================================
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const ALLOWED_SLOT_DURATIONS = [
  15,
  20,
  30,
  45,
  60,
];


// ======================================
// Public Doctor Field Projection
// ======================================
const PUBLIC_DOCTOR_FIELDS = [
  "fullName",
  "specialization",
  "experience",
  "fees",
  "address",
  "weeklyAvailability",
  "slotDuration",
  "isDemo",
].join(" ");


// ======================================
// Validate HH:mm 24-hour time
// ======================================
const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    String(time || "").trim()
  );
};


// ======================================
// Convert HH:mm to total minutes
// ======================================
const timeToMinutes = (time) => {
  if (!isValidTime(time)) {
    return null;
  }

  const [hour, minute] = time
    .split(":")
    .map(Number);

  return hour * 60 + minute;
};


// ======================================
// Validate YYYY-MM-DD
// ======================================
const isValidDateString = (dateString) => {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return false;
  }

  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};


// ======================================
// Clean Blocked Dates
// ======================================
const cleanBlockedDates = (
  blockedDates
) => {
  if (!Array.isArray(blockedDates)) {
    return [];
  }

  return [
    ...new Set(
      blockedDates
        .map((date) =>
          String(date || "").trim()
        )
        .filter(isValidDateString)
    ),
  ].sort();
};


// ======================================
// Clean and Validate Weekly Availability
// ======================================
const cleanWeeklyAvailability = (
  weeklyAvailability
) => {
  if (!Array.isArray(weeklyAvailability)) {
    return {
      valid: false,
      message:
        "Weekly availability must be provided.",
      availability: [],
    };
  }

  const providedDays = new Map();

  for (const item of weeklyAvailability) {
    const day = String(
      item?.day || ""
    ).trim();

    if (!DAYS.includes(day)) {
      return {
        valid: false,
        message:
          `Invalid availability day: ${day || "Unknown"}.`,
        availability: [],
      };
    }

    if (providedDays.has(day)) {
      return {
        valid: false,
        message:
          `Duplicate availability found for ${day}.`,
        availability: [],
      };
    }

    providedDays.set(day, item);
  }


  // Build all seven days in fixed order
  const cleanedAvailability = [];

  for (const day of DAYS) {
    const item = providedDays.get(day);

    if (!item) {
      cleanedAvailability.push({
        day,
        enabled: false,
        sessions: [],
      });

      continue;
    }

    const enabled =
      item.enabled === true;

    if (!enabled) {
      cleanedAvailability.push({
        day,
        enabled: false,
        sessions: [],
      });

      continue;
    }

    if (
      !Array.isArray(item.sessions) ||
      item.sessions.length === 0
    ) {
      return {
        valid: false,
        message:
          `${day} is enabled but has no working sessions.`,
        availability: [],
      };
    }

    const cleanedSessions = [];

    for (const session of item.sessions) {
      const startTime = String(
        session?.startTime || ""
      ).trim();

      const endTime = String(
        session?.endTime || ""
      ).trim();

      if (
        !isValidTime(startTime) ||
        !isValidTime(endTime)
      ) {
        return {
          valid: false,
          message:
            `Invalid time format in ${day}. Use HH:mm format.`,
          availability: [],
        };
      }

      const startMinutes =
        timeToMinutes(startTime);

      const endMinutes =
        timeToMinutes(endTime);

      if (startMinutes >= endMinutes) {
        return {
          valid: false,
          message:
            `${day}: session end time must be after start time.`,
          availability: [],
        };
      }

      cleanedSessions.push({
        startTime,
        endTime,
      });
    }


    // Sort sessions chronologically
    cleanedSessions.sort(
      (a, b) =>
        timeToMinutes(a.startTime) -
        timeToMinutes(b.startTime)
    );


    // Reject duplicate or overlapping sessions
    for (
      let index = 1;
      index < cleanedSessions.length;
      index += 1
    ) {
      const previous =
        cleanedSessions[index - 1];

      const current =
        cleanedSessions[index];

      if (
        timeToMinutes(current.startTime) <
        timeToMinutes(previous.endTime)
      ) {
        return {
          valid: false,
          message:
            `${day} contains overlapping working sessions.`,
          availability: [],
        };
      }
    }

    cleanedAvailability.push({
      day,
      enabled: true,
      sessions: cleanedSessions,
    });
  }


  // At least one day must be available
  const enabledDays =
    cleanedAvailability.filter(
      (item) =>
        item.enabled &&
        item.sessions.length > 0
    );

  if (enabledDays.length === 0) {
    return {
      valid: false,
      message:
        "Please enable at least one working day.",
      availability: [],
    };
  }

  return {
    valid: true,
    availability:
      cleanedAvailability,
  };
};


// ======================================
// Validate Common Doctor Fields
// ======================================
const validateDoctorFields = (body) => {
  const {
    fullName,
    phone,
    email,
    specialization,
    experience,
    fees,
    address,
  } = body;


  if (
    !String(fullName || "").trim() ||
    !String(phone || "").trim() ||
    !String(email || "").trim() ||
    !String(specialization || "").trim() ||
    !String(experience || "").trim() ||
    fees === undefined ||
    fees === null ||
    fees === "" ||
    !String(address || "").trim()
  ) {
    return {
      valid: false,
      message:
        "Please provide all required doctor details.",
    };
  }


  // Indian mobile number validation
  const cleanPhone = String(phone).trim();

  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return {
      valid: false,
      message:
        "Please enter a valid 10-digit mobile number.",
    };
  }


  // Basic email validation
  const cleanEmail =
    String(email)
      .trim()
      .toLowerCase();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      cleanEmail
    )
  ) {
    return {
      valid: false,
      message:
        "Please enter a valid email address.",
    };
  }


  const numericFees = Number(fees);

  if (
    !Number.isFinite(numericFees) ||
    numericFees < 0
  ) {
    return {
      valid: false,
      message:
        "Consultation fee must be a valid non-negative number.",
    };
  }


  const slotDuration = Number(
    body.slotDuration
  );

  if (
    !ALLOWED_SLOT_DURATIONS.includes(
      slotDuration
    )
  ) {
    return {
      valid: false,
      message:
        "Slot duration must be 15, 20, 30, 45, or 60 minutes.",
    };
  }


  return {
    valid: true,
    numericFees,
    slotDuration,
    cleanPhone,
    cleanEmail,
  };
};


// ======================================
// Build Doctor Data
// ======================================
const buildDoctorData = (
  body,
  availability,
  validationResult
) => {
  return {
    fullName:
      String(body.fullName).trim(),

    phone:
      validationResult.cleanPhone,

    email:
      validationResult.cleanEmail,

    specialization:
      String(
        body.specialization
      ).trim(),

    experience:
      String(
        body.experience
      ).trim(),

    fees:
      validationResult.numericFees,

    address:
      String(body.address).trim(),

    weeklyAvailability:
      availability,

    slotDuration:
      validationResult.slotDuration,
  };
};


// ======================================
// Apply / Reapply as Doctor
// ======================================
const applyDoctorController = async (
  req,
  res
) => {
  try {
    const fieldValidation =
      validateDoctorFields(req.body);

    if (!fieldValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          fieldValidation.message,
      });
    }


    const availabilityValidation =
      cleanWeeklyAvailability(
        req.body.weeklyAvailability
      );

    if (!availabilityValidation.valid) {
      return res.status(400).json({
        success: false,
        message:
          availabilityValidation.message,
      });
    }


    const doctorData =
      buildDoctorData(
        req.body,
        availabilityValidation.availability,
        fieldValidation
      );


    // New application may include blocked dates,
    // although normally this will be empty.
    doctorData.blockedDates =
      cleanBlockedDates(
        req.body.blockedDates
      );


    const existingDoctor =
      await Doctor.findOne({
        userId: req.user._id,
      });


    // ==================================
    // First Application
    // ==================================
    if (!existingDoctor) {
      const doctor =
        await Doctor.create({
          userId:
            req.user._id,

          ...doctorData,

          timings: [],

          status:
            "pending",
        });

      // Notify all administrator accounts.
      // Notification failure must not invalidate the submitted application.
      try {
        const admins = await User.find({
          isAdmin: true,
        }).select("_id");

        if (admins.length > 0) {
          await Notification.insertMany(
            admins.map((admin) => ({
              userId: admin._id,
              message:
                `New doctor application submitted by ${doctor.fullName}.`,
            }))
          );
        }
      } catch (notificationError) {
        console.error(
          "Doctor application notification error:",
          notificationError
        );
      }


      return res.status(201).json({
        success: true,
        message:
          "Doctor application submitted successfully.",
        doctor,
      });
    }


    // ==================================
    // Pending Application
    // ==================================
    if (
      existingDoctor.status ===
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your doctor application is already pending admin review.",
      });
    }


    // ==================================
    // Approved Doctor
    // ==================================
    if (
      existingDoctor.status ===
      "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You are already an approved doctor. Update your profile from the doctor dashboard.",
      });
    }


    // ==================================
    // Rejected Application
    // Allow Reapplication
    // ==================================
    if (
      existingDoctor.status ===
      "rejected"
    ) {
      Object.assign(
        existingDoctor,
        doctorData
      );

      existingDoctor.status =
        "pending";

      // Legacy field no longer used
      existingDoctor.timings = [];

      await existingDoctor.save();

      // Notify all administrator accounts about the resubmission.
      try {
        const admins = await User.find({
          isAdmin: true,
        }).select("_id");

        if (admins.length > 0) {
          await Notification.insertMany(
            admins.map((admin) => ({
              userId: admin._id,
              message:
                `Doctor application resubmitted by ${existingDoctor.fullName}.`,
            }))
          );
        }
      } catch (notificationError) {
        console.error(
          "Doctor reapplication notification error:",
          notificationError
        );
      }


      return res.status(200).json({
        success: true,
        message:
          "Doctor application resubmitted successfully.",
        doctor:
          existingDoctor,
      });
    }


    // ==================================
    // Suspended Doctor
    // ==================================
    if (
      existingDoctor.status ===
      "suspended"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your doctor account is suspended. Contact the administrator.",
      });
    }


    return res.status(400).json({
      success: false,
      message:
        "Invalid doctor application status.",
    });

  } catch (error) {
    console.error(
      "Apply doctor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Doctor application failed.",
    });
  }
};


// ======================================
// Get Logged-in Doctor Profile
// ======================================
const getDoctorProfileController = async (
  req,
  res
) => {
  try {
    const doctor =
      await Doctor.findOne({
        userId: req.user._id,
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });

  } catch (error) {
    console.error(
      "Get doctor profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch doctor profile.",
    });
  }
};


// ======================================
// Update Approved Doctor Profile
// ======================================
const updateDoctorProfileController =
  async (req, res) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId:
            req.user._id,
        });


      if (!doctor) {
        return res.status(404).json({
          success: false,
          message:
            "Doctor profile not found.",
        });
      }


      if (
        doctor.status !==
        "approved"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only approved doctors can update their profile.",
        });
      }


      const fieldValidation =
        validateDoctorFields(
          req.body
        );

      if (!fieldValidation.valid) {
        return res.status(400).json({
          success: false,
          message:
            fieldValidation.message,
        });
      }


      const availabilityValidation =
        cleanWeeklyAvailability(
          req.body.weeklyAvailability
        );

      if (
        !availabilityValidation.valid
      ) {
        return res.status(400).json({
          success: false,
          message:
            availabilityValidation.message,
        });
      }


      const doctorData =
        buildDoctorData(
          req.body,
          availabilityValidation.availability,
          fieldValidation
        );


      // ==================================
      // Important:
      // Preserve blockedDates when frontend
      // does not send blockedDates.
      // Replace them only when frontend
      // explicitly sends an array.
      // ==================================
      if (
        Array.isArray(
          req.body.blockedDates
        )
      ) {
        doctorData.blockedDates =
          cleanBlockedDates(
            req.body.blockedDates
          );
      }


      Object.assign(
        doctor,
        doctorData
      );


      // Legacy field is no longer used
      doctor.timings = [];


      await doctor.save();


      return res.status(200).json({
        success: true,
        message:
          "Doctor profile updated successfully.",
        doctor,
      });

    } catch (error) {
      console.error(
        "Update doctor profile error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update doctor profile.",
      });
    }
  };


// ======================================
// Get Single Approved Doctor
// ======================================
const getSingleDoctorController = async (
  req,
  res
) => {
  try {
    const doctor =
      await Doctor.findOne({
        _id: req.params.id,
        status: "approved",
      }).select(
        PUBLIC_DOCTOR_FIELDS
      );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor not found.",
      });
    }


    return res.status(200).json({
      success: true,
      doctor,
    });

  } catch (error) {
    console.error(
      "Get single doctor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch doctor.",
    });
  }
};


// ======================================
// Get All Approved Doctors
// ======================================
const getAllDoctorsController = async (
  req,
  res
) => {
  try {
    const doctors =
      await Doctor.find({
        status:
          "approved",
      })
        .select(
          PUBLIC_DOCTOR_FIELDS
        )
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({
      success: true,
      total:
        doctors.length,
      doctors,
    });

  } catch (error) {
    console.error(
      "Get all doctors error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch approved doctors.",
    });
  }
};


// ======================================
// Exports
// ======================================
module.exports = {
  applyDoctorController,
  getDoctorProfileController,
  updateDoctorProfileController,
  getSingleDoctorController,
  getAllDoctorsController,
};
