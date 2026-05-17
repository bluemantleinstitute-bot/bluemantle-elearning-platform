const express = require("express");
const router = express.Router();
const { createTeacher, createStudent, getTeachers } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Both routes must be protected using authMiddleware and roleMiddleware
router.post("/create-teacher", authMiddleware, roleMiddleware("admin"), createTeacher);
router.post("/create-student", authMiddleware, roleMiddleware("admin"), createStudent);
router.get("/teachers", authMiddleware, roleMiddleware("admin"), getTeachers);

module.exports = router;
