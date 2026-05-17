const express = require("express");
const router = express.Router();
const { updateProfile } = require("../controllers/teacherController");
const authMiddleware = require("../middleware/authMiddleware");

router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
