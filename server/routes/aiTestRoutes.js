const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/roleMiddleware");
const { generateTests, GenerationError } = require("../services/aiTestGenerator");

const router = express.Router();

// Never execute model-generated code on the application server.
router.post("/generate-tests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const candidate = await generateTests(req.body);
    return res.status(200).json({ success: true, candidate });
  } catch (error) {
    if (!(error instanceof GenerationError)) console.error("Test generation failed:", error);
    return res.status(error instanceof GenerationError ? error.status : 500).json({
      success: false,
      message: error instanceof GenerationError ? error.message : "Generation failed."
    });
  }
});
module.exports = router;
