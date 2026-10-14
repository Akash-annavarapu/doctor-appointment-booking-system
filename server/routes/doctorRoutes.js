const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const {
  applyDoctorController,
  getDoctorProfileController,
  updateDoctorProfileController,
  getSingleDoctorController,
  getAllDoctorsController,
} = require("../controllers/doctorController");

const { getPublicAvailableSlotsController } = require("../controllers/appointmentController");

const router = express.Router();

// Apply / Reapply as Doctor
router.post(
  "/apply",
  authMiddleware,
  applyDoctorController
);

// Get logged-in doctor's profile
router.get(
  "/profile",
  authMiddleware,
  getDoctorProfileController
);

// Update logged-in doctor's profile
router.put(
  "/profile",
  authMiddleware,
  updateDoctorProfileController
);

// Get all approved doctors
router.get(
  "/all",
  getAllDoctorsController
);

// Public, read-only availability lookup; does not return patient data.
router.get("/available-slots", getPublicAvailableSlotsController);

// Get one approved doctor by ID
router.get(
  "/:id",
  validateObjectId,
  getSingleDoctorController
);

module.exports = router;
