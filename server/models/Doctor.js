const mongoose = require("mongoose");

// ======================================
// Daily Session Schema
// Example:
// 09:00 -> 13:00
// 14:00 -> 17:00
// ======================================
const sessionSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
  },
  {
    _id: false,
  }
);


// ======================================
// Weekly Availability Schema
// ======================================
const dayAvailabilitySchema =
  new mongoose.Schema(
    {
      day: {
        type: String,
        required: true,
        enum: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },

      enabled: {
        type: Boolean,
        default: false,
      },

      sessions: {
        type: [sessionSchema],
        default: [],
      },
    },
    {
      _id: false,
    }
  );


// ======================================
// Doctor Schema
// ======================================
const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      required: true,
      trim: true,
    },

    fees: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },


    // ==================================
    // Fictional sample profiles for this academic demo.
    // Not real clinicians or verified credentials.
    // ==================================
    isDemo: {
      type: Boolean,
      default: false,
    },


    // ==================================
    // Legacy field
    //
    // Keep temporarily so old doctor
    // records do not break.
    // We will remove this only after
    // migration is complete.
    // ==================================
    timings: {
      type: [String],
      default: [],
    },


    // ==================================
    // New Professional Availability
    // ==================================
    weeklyAvailability: {
      type: [dayAvailabilitySchema],
      default: [],
    },


    // ==================================
    // Appointment Duration in Minutes
    // ==================================
    slotDuration: {
      type: Number,
      enum: [15, 20, 30, 45, 60],
      default: 30,
    },


    // ==================================
    // Doctor Leave / Unavailable Dates
    // Format: YYYY-MM-DD
    // ==================================
    blockedDates: {
      type: [String],
      default: [],
    },


    // ==================================
    // Application Status
    // ==================================
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "suspended",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);


// ======================================
// Export Model
// ======================================
module.exports = mongoose.model(
  "Doctor",
  doctorSchema
);
