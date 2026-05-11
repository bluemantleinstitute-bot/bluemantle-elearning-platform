const express = require("express");
const router = express.Router();
const zoomController = require("../controllers/zoomController");
const authMiddleware = require("../middleware/authMiddleware");

// Generate Zoom Meeting SDK Signature
// Accessible by both students and teachers (they will have different roles passed)
router.post("/generate-signature", authMiddleware, zoomController.generateSignature);

module.exports = router;
