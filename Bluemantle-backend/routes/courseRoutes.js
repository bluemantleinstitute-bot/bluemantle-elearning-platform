const express = require("express");
const router = express.Router();

const { 
    createCourse, 
    getCourses, 
    getCourseDetails, 
    getCourseVideos, 
    getCourseNotes,
    updateCourse,
    deleteCourse,
    restoreCourse
} = require("../controllers/courseController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const courseAccessMiddleware = require("../middleware/courseAccessMiddleware");

// Admin and Teacher routes
router.post("/", authMiddleware, roleMiddleware("admin", "owner", "teacher"), createCourse);
router.put("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), updateCourse);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "owner"), deleteCourse);
router.post("/:id/restore", authMiddleware, roleMiddleware("admin", "owner"), restoreCourse);

// Get all courses (authenticated)
router.get("/", authMiddleware, getCourses);

// Get specific course aggregated details (requires enrollment)
router.get("/:id", authMiddleware, courseAccessMiddleware, getCourseDetails);

// Get specific course videos directly
router.get("/:id/videos", authMiddleware, courseAccessMiddleware, getCourseVideos);

// Get specific course notes directly
router.get("/:id/notes", authMiddleware, courseAccessMiddleware, getCourseNotes);

module.exports = router;
