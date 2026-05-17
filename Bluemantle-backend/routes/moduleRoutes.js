const express = require("express");
const router = express.Router();

const { createModule, getCourseModules, updateModule, deleteModule } = require("../controllers/moduleController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin and Teacher manage modules
router.post("/", authMiddleware, roleMiddleware("admin", "owner", "teacher"), createModule);
router.put("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), updateModule);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), deleteModule);

// Get modules for a specific course
router.get("/:courseId", authMiddleware, getCourseModules);

module.exports = router;
