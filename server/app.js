const express = require("express");
const aiTestRoutes = require("./routes/aiTestRoutes");
const reportRoutes = require("./routes/reportRoutes");
const cors = require("cors");

const authRoutes = require(
  "./routes/authRoutes"
);
const userRoutes = require(
  "./routes/userRoutes"
);
const doctorRoutes = require(
  "./routes/doctorRoutes"
);
const adminRoutes = require(
  "./routes/adminRoutes"
);
const appointmentRoutes = require(
  "./routes/appointmentRoutes"
);


const notificationRoutes = require(
  "./routes/notificationRoutes"
);


const app = express();


// ======================================
// Middleware
// ======================================
app.use(cors());
app.use(express.json({ limit: "400kb" }));


// ======================================
// API Routes
// ======================================
app.use(
  "/api/v1/auth",
  authRoutes
);

app.use(
  "/api/v1/user",
  userRoutes
);

app.use(
  "/api/v1/doctor",
  doctorRoutes
);

app.use(
  "/api/v1/admin",
  adminRoutes
);

app.use(
  "/api/v1/appointment",
  appointmentRoutes
);



app.use(
  "/api/v1/notification",
  notificationRoutes
);

// TestPilot AI generation (admin JWT only) and signed CI reporting.
app.use("/api/ai", aiTestRoutes);
app.use("/api/reports", reportRoutes);
// Compatibility with the frontend's existing /api/v1 base URL.
app.use("/api/v1/reports", reportRoutes);

// ======================================
// Health Route
// ======================================
app.get("/", (req, res) => {
  return res.send(
    "Doctor Appointment Booking System API is Running..."
  );
});


module.exports = app;
