const express = require("express");
const router = express.Router();

const { markAttendance, getStudentAttendance, getClassAttendance, getAdminStats } = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Admin stats
router.get("/admin/stats", authMiddleware, roleMiddleware("admin", "owner"), getAdminStats);

// Teacher marking (admin implicitly allowed in controller if needed, but strict to teacher here)
router.post("/mark", authMiddleware, roleMiddleware("teacher"), markAttendance);

// Auth views
router.get("/my-attendance", authMiddleware, getStudentAttendance);
router.get("/student/:id", authMiddleware, getStudentAttendance);
router.get("/class/:id", authMiddleware, getClassAttendance);

module.exports = router;
