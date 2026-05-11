const express = require("express");
const router = express.Router();

const { scheduleClass, getAllClasses, getClassById, getTeacherClasses, getBatchClasses, getMyClasses, joinLive, watchRecording, updateStatus, finishLiveClass, reigniteLiveClass, updateClass, deleteClass, syncZoomAttendance, syncCloudRecording } = require("../controllers/liveClassController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ── Named/static routes MUST come before /:id wildcard ──────────────────────

// Admin: schedule and list all
router.post("/", authMiddleware, roleMiddleware("admin", "owner", "teacher"), scheduleClass);
router.get("/", authMiddleware, roleMiddleware("admin", "owner"), getAllClasses);

// Teacher-specific views
router.get("/teacher", authMiddleware, roleMiddleware("teacher", "admin", "owner"), getTeacherClasses);

// Student views
router.get("/my-classes", authMiddleware, getMyClasses);

// Attendance & actions
router.post("/join-live", authMiddleware, joinLive);
router.post("/watch-recording", authMiddleware, watchRecording);
router.post("/sync-zoom-attendance", authMiddleware, roleMiddleware("teacher", "admin", "owner"), syncZoomAttendance);

// Batch-scoped view
router.get("/batch/:batchId", authMiddleware, getBatchClasses);

// ── Wildcard /:id routes LAST ────────────────────────────────────────────────
router.get("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), getClassById);
router.put("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), updateClass);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "owner", "teacher"), deleteClass);
router.put("/:classId/status", authMiddleware, updateStatus);
router.post("/:id/finish", authMiddleware, roleMiddleware("teacher", "admin", "owner"), finishLiveClass);
router.post("/:id/reignite", authMiddleware, roleMiddleware("teacher", "admin", "owner"), reigniteLiveClass);
router.post("/:id/sync-recording", authMiddleware, roleMiddleware("teacher", "admin", "owner"), syncCloudRecording);

module.exports = router;
