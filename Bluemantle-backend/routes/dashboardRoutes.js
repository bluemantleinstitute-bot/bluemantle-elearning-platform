const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET /api/dashboard/student
router.get(
  "/student",
  auth,
  roleMiddleware("student"),
  dashboardController.getStudentDashboard
);

// GET /api/dashboard/teacher
router.get(
  "/teacher",
  auth,
  roleMiddleware("teacher"),
  dashboardController.getTeacherDashboard
);

// GET /api/dashboard/admin
router.get(
  "/admin",
  auth,
  roleMiddleware("admin", "owner"),
  dashboardController.getAdminDashboard
);

module.exports = router;
