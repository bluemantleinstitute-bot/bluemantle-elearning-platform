const express = require("express");
const router = express.Router();
const { updateProfile, getMyProfile, listPublicTeacherProfiles, clearOtherSessions } = require("../controllers/teacherController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/profiles", authMiddleware, listPublicTeacherProfiles);
router.get("/profile", authMiddleware, getMyProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/sessions/clear-others", authMiddleware, clearOtherSessions);

module.exports = router;
